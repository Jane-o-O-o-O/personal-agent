//! Quote-repair candidate enumeration: the search core of
//! [`super::repair_json`].
//!
//! Search: a quote only forks where JSON structure can actually resume
//! after it ([`resumes_structure`]). That is a *necessary* condition for
//! the terminate reading, so no path able to survive the strict parse is
//! lost, while prose — where a quote is followed by more prose — stops
//! forking at all; the exponential blow-up collapses to the handful of
//! real member boundaries. The frontier is popped best-first, fewest
//! escapes first (see [`ScanState::cmp`]), so the first completed path is
//! the one scoring key ③ prefers instead of the worst one; with no schema
//! to rank by, ③ decides outright and that ordering licenses
//! branch-and-bound ([`QuoteCandidates::bound_by_escapes`]) — the
//! enumeration stops as soon as no queued path can beat the incumbent.
//!
//! Memory: a scan path never carries the output rewritten so far. The
//! only rewrite performed here is inserting a `\` before selected quotes,
//! so a path is fully described by the *offsets* of those quotes — held
//! in a shared cons list ([`EscapeTrail`]) — plus a `Copy` bracket bitmask
//! ([`BracketStack`]). Forking therefore costs O(1) (one `Rc` bump, no
//! allocation), prefixes are shared across paths, and a dead path drops
//! its own nodes immediately; the output string materialises once per
//! structurally complete path, right before the strict parse. Live memory
//! is thus O([`MAX_QUEUED_PATHS`] × 64 B + input) instead of
//! O(queued paths × input). Budgets still cap explored and
//! queued paths; an overrun truncates enumeration and keeps the
//! candidates found so far.

use std::cmp::Ordering;
use std::collections::BinaryHeap;
use std::rc::Rc;

use serde::de::IgnoredAny;
use serde_json::Value;

// ── Budgets ───────────────────────────────────────────────

/// Upper bound on quote-repair candidates. Corpus measurements show the
/// candidate count does not grow with the number of unescaped quotes
/// (almost every fork fails strict parsing), so a small cap suffices.
const MAX_CANDIDATES: usize = 64;

/// Upper bound on scan paths popped off the work queue. Every popped path
/// walks the rest of the input, so this is the multiplier on the O(input)
/// scan cost — a CPU bound, not a memory one.
const MAX_EXPLORED_PATHS: usize = 512;

/// Upper bound on scan paths waiting in the work queue. A queued path is a
/// ~64-byte [`ScanState`] sharing its escape trail with its parent, so this
/// caps live enumeration memory in the tens of KiB whatever the input size.
const MAX_QUEUED_PATHS: usize = 512;

/// Nesting depth beyond which a scan path is abandoned. Matches
/// `serde_json`'s recursion limit: a deeper path could never survive the
/// final strict parse, so pruning is free — and it keeps [`BracketStack`]
/// a single `u128`, making fork clones allocation-free.
const MAX_NESTING_DEPTH: u32 = 128;

/// Enumeration budgets, threaded through so tests can shrink them.
#[derive(Clone, Copy)]
pub(super) struct Budgets {
    /// Max candidates yielded (see [`MAX_CANDIDATES`]).
    pub(super) candidates: usize,
    /// Max paths popped off the queue (see [`MAX_EXPLORED_PATHS`]).
    pub(super) explored: usize,
    /// Max paths held in the queue (see [`MAX_QUEUED_PATHS`]).
    pub(super) queued: usize,
}

impl Default for Budgets {
    fn default() -> Self {
        Self {
            candidates: MAX_CANDIDATES,
            explored: MAX_EXPLORED_PATHS,
            queued: MAX_QUEUED_PATHS,
        }
    }
}

// ── Candidate enumeration ─────────────────────────────────

/// Which repair path produced a candidate; quote-repair wins ties so a
/// conservative escape rewrite is preferred over jsonrepair's restructuring.
#[derive(Clone, Copy)]
pub(super) enum Source {
    QuoteRepair,
    Jsonrepair,
}

impl Source {
    pub(super) fn rank(self) -> u8 {
        match self {
            Self::QuoteRepair => 0,
            Self::Jsonrepair => 1,
        }
    }
}

pub(super) struct Candidate {
    pub(super) value: Value,
    pub(super) escapes: usize,
    pub(super) source: Source,
}

/// Open containers packed into a bitmask — one bit per level, `1` for `{`
/// and `0` for `[`. Capped at [`MAX_NESTING_DEPTH`] so the whole stack is
/// `Copy` and a fork needs no allocation.
#[derive(Clone, Copy, Default)]
struct BracketStack {
    bits: u128,
    depth: u32,
}

impl BracketStack {
    /// Push an open container; `false` when the depth cap is reached.
    fn push(&mut self, brace: bool) -> bool {
        if self.depth >= MAX_NESTING_DEPTH {
            return false;
        }
        if brace {
            self.bits |= 1u128 << self.depth;
        } else {
            self.bits &= !(1u128 << self.depth);
        }
        self.depth += 1;
        true
    }

    /// Pop the innermost container; `false` when it is empty or the
    /// closing bracket does not match the opening one.
    fn pop(&mut self, brace: bool) -> bool {
        let Some(depth) = self.depth.checked_sub(1) else {
            return false;
        };
        if (self.bits >> depth) & 1 != u128::from(brace) {
            return false;
        }
        self.depth = depth;
        true
    }

    /// Whether the innermost open container is an object (`{`).
    fn in_object(self) -> bool {
        self.depth > 0 && (self.bits >> (self.depth - 1)) & 1 == 1
    }

    fn is_empty(self) -> bool {
        self.depth == 0
    }
}

/// Shared, immutable list of escaped quote offsets, newest first.
///
/// This is the whole rewrite record of a scan path: the output equals the
/// input with a `\` inserted at each offset. Forking clones one `Rc`
/// handle, so branches share their common prefix and a dying path drops
/// only the nodes it added.
struct EscapeTrail {
    offset: usize,
    rest: Option<Rc<EscapeTrail>>,
}

impl Drop for EscapeTrail {
    /// Unlink iteratively. The derived recursive drop would take one stack
    /// frame per recorded escape, and a single long string value can record
    /// thousands — dropping a dead path would then risk a stack overflow.
    fn drop(&mut self) {
        let mut next = self.rest.take();
        while let Some(node) = next {
            // Only the last owner unlinks; a node still shared with a
            // queued path is dropped when that path is.
            next = match Rc::try_unwrap(node) {
                Ok(mut node) => node.rest.take(),
                Err(_) => None,
            };
        }
    }
}

/// Materialise a path's rewritten output from its escape trail.
fn render(input: &str, trail: Option<&EscapeTrail>, escapes: usize) -> String {
    let mut offsets = Vec::with_capacity(escapes);
    let mut node = trail;
    while let Some(current) = node {
        offsets.push(current.offset);
        node = current.rest.as_deref();
    }
    // A path only ever moves forward, so reversing the newest-first chain
    // yields strictly ascending offsets.
    offsets.reverse();
    let mut out = String::with_capacity(input.len() + offsets.len());
    let mut cut = 0;
    for offset in offsets {
        out.push_str(&input[cut..offset]);
        out.push('\\');
        cut = offset;
    }
    out.push_str(&input[cut..]);
    out
}

/// One in-progress scan path through the raw input. Every field is `Copy`
/// or an `Rc` handle: no owned rewrite buffer, so forking a path is O(1)
/// and allocation-free.
struct ScanState {
    pos: usize,
    trail: Option<Rc<EscapeTrail>>,
    escapes: usize,
    stack: BracketStack,
    /// Last significant structural byte, used to tell keys from values.
    last_sig: Option<u8>,
}

// Compile-time memory invariants, checked by `cargo check` itself. A queued
// path must stay allocation-free and the whole work queue must stay in the
// tens of KiB, independent of the input size — this is what keeps the
// enumerator from ever growing memory with the input again. Relaxing any of
// these on purpose (e.g. raising budgets) requires updating the bound in
// the same commit, so the regression cannot slip in unnoticed.
const _: () = {
    assert!(
        std::mem::size_of::<ScanState>() <= 64,
        "ScanState must stay output-free: fork clones must be O(1)"
    );
    assert!(
        std::mem::size_of::<EscapeTrail>() <= 32,
        "EscapeTrail nodes must stay small"
    );
    assert!(
        MAX_QUEUED_PATHS * std::mem::size_of::<ScanState>() <= 32 * 1024,
        "the work queue must stay within 32 KiB whatever the input size"
    );
};

impl Ord for ScanState {
    /// Search priority, not a value ordering: [`BinaryHeap`] pops the
    /// greatest element, and the path worth exploring next is the one that
    /// has escaped the fewest quotes — scoring key ③ — so the comparison on
    /// `escapes` is deliberately reversed. Escapes never decrease along a
    /// path, which makes this a uniform-cost search: the first completed
    /// path carries the fewest escapes of all reachable ones. Ties go to
    /// the path that has advanced furthest, so a candidate surfaces with
    /// the least remaining work.
    fn cmp(&self, other: &Self) -> Ordering {
        other
            .escapes
            .cmp(&self.escapes)
            .then_with(|| self.pos.cmp(&other.pos))
    }
}

impl PartialOrd for ScanState {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

impl PartialEq for ScanState {
    fn eq(&self, other: &Self) -> bool {
        self.cmp(other) == Ordering::Equal
    }
}

impl Eq for ScanState {}

/// Enumerate strict-valid rewrites of `input` produced by escaping a subset
/// of the unescaped quotes inside string values. The returned iterator is
/// lazy: candidates surface one at a time as scan paths complete, fewest
/// escapes first, and a budget overrun only flags
/// [`QuoteCandidates::truncated`] without discarding what was already
/// yielded.
pub(super) fn enumerate_quote_candidates(input: &str, budgets: Budgets) -> QuoteCandidates<'_> {
    let mut work = BinaryHeap::new();
    work.push(ScanState {
        pos: 0,
        trail: None,
        escapes: 0,
        stack: BracketStack::default(),
        last_sig: None,
    });
    QuoteCandidates {
        input,
        work,
        explored: 0,
        yielded: 0,
        budgets,
        bounded: false,
        best_escapes: usize::MAX,
        truncated: false,
        done: false,
    }
}

/// Lazy enumerator over strict-valid quote-repair rewrites, popped
/// best-first (see [`ScanState::cmp`]).
///
/// Budgets: see [`Budgets`] — candidates yielded, paths popped (CPU) and
/// paths queued (memory) each have their own cap. Hitting a budget stops
/// the enumeration early and sets [`Self::truncated`]; items yielded so far
/// stay valid.
pub(super) struct QuoteCandidates<'a> {
    input: &'a str,
    work: BinaryHeap<ScanState>,
    explored: usize,
    yielded: usize,
    budgets: Budgets,
    /// Whether branch-and-bound is on (see [`Self::bound_by_escapes`]).
    bounded: bool,
    /// Fewest escapes among the candidates yielded so far, the bound to
    /// beat once [`Self::bounded`] is set.
    best_escapes: usize,
    truncated: bool,
    done: bool,
}

impl QuoteCandidates<'_> {
    /// Whether a budget stopped the enumeration before it drained naturally.
    pub(super) fn truncated(&self) -> bool {
        self.truncated
    }

    /// Enable branch-and-bound on the escape count.
    ///
    /// Only sound when the caller ranks candidates by escape count alone
    /// (i.e. no schema): paths are popped in ascending escape order and
    /// escapes never decrease, so once the popped path has already reached
    /// the escape count of a yielded candidate, no queued path can ever
    /// beat it — ties included, since scoring keeps the earlier candidate.
    /// The enumeration then stops without truncation: nothing of value is
    /// left behind.
    pub(super) fn bound_by_escapes(&mut self) {
        self.bounded = true;
    }
}

impl Iterator for QuoteCandidates<'_> {
    type Item = Candidate;

    fn next(&mut self) -> Option<Candidate> {
        while !self.done {
            let Some(state) = self.work.pop() else {
                self.done = true;
                return None;
            };
            if self.bounded && state.escapes >= self.best_escapes {
                // Cheapest path in the queue, and it already cannot win.
                self.done = true;
                return None;
            }
            self.explored += 1;
            if self.explored > self.budgets.explored || self.yielded >= self.budgets.candidates {
                self.truncated = true;
                self.done = true;
                return None;
            }
            match advance(self.input, state, &mut self.work, self.budgets.queued) {
                PathOutcome::Candidate(candidate) => {
                    self.yielded += 1;
                    self.best_escapes = self.best_escapes.min(candidate.escapes);
                    return Some(candidate);
                }
                PathOutcome::Dead => {}
                PathOutcome::BudgetExceeded => {
                    self.truncated = true;
                    self.done = true;
                    return None;
                }
            }
        }
        None
    }
}

/// Outcome of advancing one scan path to its end.
enum PathOutcome {
    /// The path completed as strict-valid JSON.
    Candidate(Candidate),
    /// The path died (bracket mismatch, unterminated string, bad key, ...)
    /// without producing JSON.
    Dead,
    /// The queued-path budget was exhausted mid-scan; the caller stops the
    /// whole enumeration and flags truncation.
    BudgetExceeded,
}

/// Advance one scan path in structural mode. Each unescaped quote inside a
/// string value may fork: the terminate branch is queued onto `work`, the
/// escape branch continues inline. Forking is gated by
/// [`resumes_structure`]. A completed path that yields strict-valid JSON
/// comes back as [`PathOutcome::Candidate`].
///
/// Scanning is byte-oriented: every structural character is ASCII and UTF-8
/// continuation bytes are all `>= 0x80`, so multi-byte text can never be
/// mistaken for structure and no `char` buffer is needed.
fn advance(
    input: &str,
    st: ScanState,
    work: &mut BinaryHeap<ScanState>,
    max_queued: usize,
) -> PathOutcome {
    let bytes = input.as_bytes();
    // Destructured so the (stale) `pos` of the incoming state cannot be
    // misread: `i` is the single source of truth for the cursor, and every
    // queued branch spells out its own resume position.
    let ScanState {
        pos: mut i,
        mut trail,
        mut escapes,
        mut stack,
        mut last_sig,
    } = st;
    while i < bytes.len() {
        let byte = bytes[i];
        match byte {
            b'{' | b'[' => {
                if !stack.push(byte == b'{') {
                    // Deeper than serde_json's recursion limit, so the
                    // final strict parse would reject this path anyway.
                    return PathOutcome::Dead;
                }
                last_sig = Some(byte);
                i += 1;
            }
            b'}' | b']' => {
                if !stack.pop(byte == b'}') {
                    return PathOutcome::Dead;
                }
                last_sig = Some(byte);
                i += 1;
            }
            b',' | b':' => {
                last_sig = Some(byte);
                i += 1;
            }
            b'"' => {
                // Container top `{` + preceding `{` or `,` ⇒ this quote opens
                // a key; keys are parsed strictly. Anything else is a value
                // and enters the escape-vs-terminate fork.
                let is_key = stack.in_object() && matches!(last_sig, Some(b'{' | b','));
                if is_key {
                    let Some(end) = scan_json_string(input, i) else {
                        return PathOutcome::Dead;
                    };
                    last_sig = Some(b'"');
                    i = end;
                    continue;
                }
                i += 1;
                while i < bytes.len() {
                    match bytes[i] {
                        b'\\' => {
                            if i + 1 >= bytes.len() {
                                return PathOutcome::Dead;
                            }
                            i += 2;
                        }
                        b'"' => {
                            // Fork only where the structure can genuinely
                            // resume. A run of consecutive quotes therefore
                            // forks at its last quote alone: every earlier
                            // one is followed by `"`, which is body text by
                            // definition.
                            if resumes_structure(bytes, i + 1, stack) {
                                if work.len() >= max_queued {
                                    return PathOutcome::BudgetExceeded;
                                }
                                work.push(ScanState {
                                    pos: i + 1,
                                    trail: trail.clone(),
                                    escapes,
                                    stack,
                                    last_sig: Some(b'"'),
                                });
                            }
                            trail = Some(Rc::new(EscapeTrail {
                                offset: i,
                                rest: trail,
                            }));
                            escapes += 1;
                            i += 1;
                        }
                        // Body text, including UTF-8 continuation bytes and
                        // structural characters, is carried over verbatim.
                        _ => i += 1,
                    }
                }
                // Unterminated string: this path cannot produce JSON.
                return PathOutcome::Dead;
            }
            _ => {
                if !is_json_whitespace(byte) {
                    // Literals, numbers and junk are copied verbatim; the
                    // final strict parse filters invalid paths.
                    last_sig = Some(byte);
                }
                i += 1;
            }
        }
    }
    if stack.is_empty() {
        let output = render(input, trail.as_deref(), escapes);
        if let Ok(value) = serde_json::from_str::<Value>(&output) {
            return PathOutcome::Candidate(Candidate {
                value,
                escapes,
                source: Source::QuoteRepair,
            });
        }
    }
    PathOutcome::Dead
}

/// Whether JSON structure can resume at `pos`, i.e. whether ending a
/// string value just before it is a reading worth queueing.
///
/// This is a *necessary* condition for the terminate branch, checked
/// against the grammar rather than guessed: whatever follows a string value
/// is either the end of the input, the closing bracket of the innermost
/// open container, or a separator introducing another member — an object
/// member always spelling `"key" :`. Every rejected fork would have died at
/// the final strict parse anyway, so pruning cannot lose a candidate; what
/// it does lose is the exponential fork count on prose, where a quote is
/// followed by more prose.
///
/// Cost stays linear overall: the object-member probe scans at most up to
/// the quote after the next one, and those spans telescope across fork
/// sites.
fn resumes_structure(bytes: &[u8], pos: usize, stack: BracketStack) -> bool {
    let next = skip_whitespace(bytes, pos);
    match bytes.get(next) {
        // A top-level string value may be the whole document.
        None => stack.is_empty(),
        // A closing bracket has to match the innermost open container,
        // otherwise the path dies on the very next byte.
        Some(b'}') => stack.in_object(),
        Some(b']') => !stack.is_empty() && !stack.in_object(),
        // Object member separator: a key and its colon must follow. Only
        // the shape is probed here — the strict validation happens when the
        // scan reaches that key.
        Some(b',') if stack.in_object() => {
            let key = skip_whitespace(bytes, next + 1);
            find_string_end(bytes, key)
                .is_some_and(|end| bytes.get(skip_whitespace(bytes, end)) == Some(&b':'))
        }
        // Array element separator: another value must follow.
        Some(b',') if !stack.is_empty() => matches!(
            bytes.get(skip_whitespace(bytes, next + 1)),
            Some(b'"' | b'{' | b'[' | b'-' | b't' | b'f' | b'n' | b'0'..=b'9')
        ),
        // Anything else — including a separator with no open container —
        // means the quote is body text.
        _ => false,
    }
}

/// Validate the JSON string literal starting at `start` and return the
/// offset just past its closing quote.
///
/// Allocation-free: escapes are validated in place by
/// [`serde::de::IgnoredAny`] and the decoded text is never needed — the key
/// is carried over verbatim from the input.
fn scan_json_string(input: &str, start: usize) -> Option<usize> {
    let end = find_string_end(input.as_bytes(), start)?;
    serde_json::from_str::<IgnoredAny>(&input[start..end]).ok()?;
    Some(end)
}

/// Locate the closing quote of the string literal starting at `start` and
/// return the offset just past it. Escape *syntax* is honoured (`\"` does
/// not close the string) but not validated.
fn find_string_end(bytes: &[u8], start: usize) -> Option<usize> {
    if bytes.get(start) != Some(&b'"') {
        return None;
    }
    let mut pos = start + 1;
    let mut escaped = false;
    while let Some(&byte) = bytes.get(pos) {
        if escaped {
            escaped = false;
        } else if byte == b'\\' {
            escaped = true;
        } else if byte == b'"' {
            return Some(pos + 1);
        }
        pos += 1;
    }
    None
}

fn skip_whitespace(bytes: &[u8], mut pos: usize) -> usize {
    while bytes.get(pos).is_some_and(|byte| is_json_whitespace(*byte)) {
        pos += 1;
    }
    pos
}

/// Whitespace as JSON defines it. Deliberately narrower than
/// `char::is_whitespace`: treating, say, U+3000 as whitespace would only
/// spawn forks that the final strict parse is bound to reject.
fn is_json_whitespace(byte: u8) -> bool {
    matches!(byte, b' ' | b'\t' | b'\n' | b'\r')
}

#[cfg(test)]
mod tests {
    //! ## 模块摘要：quote 候选枚举器（lookahead 剪枝 + best-first 搜索 + 内存护栏）
    //!
    //! ### 关键接口
    //! - [enumerate_quote_candidates] / [advance] — 容器栈扫描与 value 内引号分叉枚举
    //! - [resumes_structure] — 分叉前瞻：引号后结构可真正恢复才排队 terminate 分支
    //! - [QuoteCandidates::bound_by_escapes] — 无 schema 时的分支限界（转数数沿路径不降
    //!   + best-first ⇒ 队首即最优下界）
    //! - [EscapeTrail] / [render] / [BracketStack] — 扫描路径的轻量表示与输出物化
    //! - [mem_probe] — TLS 计数 allocator，量化护栏测试的活内存峰值
    //!
    //! ### 关键分支与异常路径
    //! - 分叉剪枝：`,` 后不是「键 + 冒号」、闭括号与栈顶不匹配、非顶层 EOF → 引号视为正文不分叉
    //! - 预算：探索数（CPU）/ 排队数（内存）/ 候选数任一超限 → truncated 并保留已产出候选
    //! - 深度：嵌套超过 serde_json 递归上限（128）的路径直接淘汰（strict parse 本就拒绝）
    //! - 内存：ScanState ≤ 64 B、EscapeTrail ≤ 32 B、队列 ≤ 32 KiB 由编译期断言锁死；
    //!   病态输入峰值 ≤ 输入 × 8 + 2 MiB 由 mem_probe 量化护栏
    //! - 析构：EscapeTrail 手工迭代 Drop，10 万级长链不递归爆栈
    //!
    //! ### 上下游交互
    //! - 上游：[super::repair_json_inner]（无 schema 时开启分支限界）
    //! - 下游：serde_json（key 就地校验与终态 strict 解析）

    use serde_json::Value;

    use super::*;

    /// P2：[resumes_structure] 病态输入被前瞻剪枝为近线性扫描（护栏：二次方膨胀 + 预算截断）
    /// 条件：两种病态形态——① value 内含 2 万组 `","`；② 80 万字节正文之后才出现
    ///       600 组引号（逐组无条件分叉、每条排队路径克隆一份已重写前缀的实现
    ///       实测峰值 416 MB / 0.29s）
    /// 断言：`,` 后不是「键 + 冒号」的引号一律不分叉，故两者都只探索 2 条路径、
    ///       不触发任何预算截断，且只剩「正文全转义、值尾收口」这一个候选
    #[test]
    fn enumerate_quote_candidates_pathological_input_is_bounded() {
        let dense = format!("{{\"a\":\"{}}}", "\",\"".repeat(20_000));
        let late_forks = format!("{{\"a\":\"{}{}}}", "x".repeat(800_000), "\",\"".repeat(600));
        for raw in [dense, late_forks] {
            let mut enumeration = enumerate_quote_candidates(&raw, Budgets::default());
            let candidates: Vec<_> = enumeration.by_ref().collect();
            assert!(
                !enumeration.truncated(),
                "lookahead must prune the blow-up instead of hitting a budget"
            );
            assert_eq!(candidates.len(), 1);
            assert_eq!(
                enumeration.explored, 2,
                "explored: {}",
                enumeration.explored
            );
            assert!(enumeration.work.len() <= MAX_QUEUED_PATHS);
        }
    }

    /// P2：[EscapeTrail] 超长转义链析构不递归
    /// 条件：单个 string value 内含 10 万个「引号 + 字符」组（全部必须转义、只在
    ///       值尾产生一次分叉），转义链长度 10 万
    /// 断言：正常产出 1 个候选且转义数为 10 万——派生 Drop 会按链长递归，
    ///       该输入下必然爆栈；本用例失败形态是进程崩溃而非断言失败
    #[test]
    fn escape_trail_drops_long_chain_iteratively() {
        const QUOTES: usize = 100_000;
        let raw = format!("{{\"a\":\"{}\"}}", "\"x".repeat(QUOTES));
        let candidates: Vec<_> = enumerate_quote_candidates(&raw, Budgets::default()).collect();
        assert_eq!(candidates.len(), 1);
        assert_eq!(candidates[0].escapes, QUOTES);
    }

    /// P1：[enumerate_quote_candidates] 病态输入的活内存峰值与输入长度成线性且系数有界
    /// （量化内存回归护栏，与 ScanState 布局的编译期断言互补）
    /// 条件：TLS 计数 allocator 圈定测量区间，分别跑「晚分叉大输入」与「密集分叉」
    /// 断言：线程活内存峰值 ≤ 输入长度 × 8 + 2 MiB。基线实测约 5 MB / 800 KB
    ///       输入，其中大部分是把产出物化为 [Value] 的固有成本（快路径同样要付），
    ///       枚举自身只占零头；若退化为「每条排队路径克隆已重写输出」，同输入
    ///       下峰值 416 MB，超出本阈值约 50 倍
    #[test]
    fn enumeration_peak_memory_stays_proportional_to_input() {
        let late_forks = format!("{{\"a\":\"{}{}}}", "x".repeat(800_000), "\",\"".repeat(600));
        let dense = format!("{{\"a\":\"{}}}", "\",\"".repeat(20_000));
        for raw in [late_forks, dense] {
            mem_probe::reset_peak();
            let candidates: Vec<_> = enumerate_quote_candidates(&raw, Budgets::default()).collect();
            let peak = mem_probe::peak_bytes();
            drop(candidates);
            let budget = raw.len() as isize * 8 + 2 * 1024 * 1024;
            assert!(
                peak <= budget,
                "peak live memory {peak} bytes exceeds budget {budget} \
                 for a {}-byte input; enumeration memory must stay bounded",
                raw.len()
            );
        }
    }

    /// P2：[QuoteCandidates] 排队预算的行为：超限即截断、不超限时自然排空
    /// 条件：同一输入 ["a "quote""]（值尾一次真实分叉），queued 分别强制为 0 与 1
    /// 断言：queued=0 → 首个分叉即 BudgetExceeded，无候选且 truncated()=true；
    ///       queued=1 → 分叉入队后自然排空，产出 1 个候选且不标记截断
    ///       （「截断保留已产出候选」的语义由 repair_json_candidate_cap_keeps_partial_candidates
    ///       经候选数预算覆盖，两条截断路径共用同一迭代器出口）
    #[test]
    fn enumerate_quote_candidates_queue_budget() {
        let raw = r#"["a "quote""]"#;
        let zero = Budgets {
            queued: 0,
            ..Budgets::default()
        };
        let mut enumeration = enumerate_quote_candidates(raw, zero);
        let candidates: Vec<_> = enumeration.by_ref().collect();
        assert!(enumeration.truncated());
        assert!(candidates.is_empty());

        let one = Budgets {
            queued: 1,
            ..Budgets::default()
        };
        let mut enumeration = enumerate_quote_candidates(raw, one);
        let candidates: Vec<_> = enumeration.by_ref().collect();
        assert!(
            !enumeration.truncated(),
            "cap 1 never binds: the single fork is explored after the first path dies"
        );
        assert_eq!(candidates.len(), 1);
    }

    /// 测试辅助：线程局部活内存计数的 global allocator，用于量化单次操作的峰值。
    ///
    /// 每线程独立计数，并行测试线程的分配不会互相混入；`reset_peak` /
    /// `peak_bytes` 圈出测量区间。线程退出阶段 TLS 可能已销毁，计数经
    /// `try_with` 静默跳过（此时漏记只会让护栏变宽松，不会误报）。
    mod mem_probe {
        use std::alloc::{GlobalAlloc, Layout, System};
        use std::cell::Cell;

        thread_local! {
            static LIVE: Cell<isize> = const { Cell::new(0) };
            static PEAK: Cell<isize> = const { Cell::new(0) };
        }

        struct Probe;

        unsafe impl GlobalAlloc for Probe {
            /// 委托系统分配器并把请求大小计入本线程活内存。
            unsafe fn alloc(&self, layout: Layout) -> *mut u8 {
                let ptr = unsafe { System.alloc(layout) };
                if !ptr.is_null() {
                    track(layout.size() as isize);
                }
                ptr
            }

            /// 委托系统分配器并从本线程活内存扣减。
            unsafe fn dealloc(&self, ptr: *mut u8, layout: Layout) {
                track(-(layout.size() as isize));
                unsafe { System.dealloc(ptr, layout) };
            }
        }

        #[global_allocator]
        static PROBE: Probe = Probe;

        fn track(delta: isize) {
            let _ = LIVE.try_with(|live| {
                let next = live.get() + delta;
                live.set(next);
                let _ = PEAK.try_with(|peak| {
                    if next > peak.get() {
                        peak.set(next);
                    }
                });
            });
        }

        /// 把峰值重置为当前活内存，开始一个测量区间。
        pub(super) fn reset_peak() {
            LIVE.with(|live| PEAK.with(|peak| peak.set(live.get())));
        }

        /// 测量区间内本线程的活内存峰值（含区间开始前已持有的部分）。
        pub(super) fn peak_bytes() -> isize {
            PEAK.with(Cell::get)
        }
    }

    /// P1：[advance] 嵌套深度超过 serde_json 递归上限的路径被提前剪枝
    /// 条件：同一形态的输入分别嵌套 100 层（上限内）与 130 层（超上限），
    ///       最内层 value 含未转义引号
    /// 断言：100 层产出 1 个引号修复候选（escapes=1）；130 层不产出任何候选，
    ///       且其"正确修复形态"本就被 serde_json 拒绝（剪枝不改变结果）
    #[test]
    fn enumerate_quote_candidates_prunes_beyond_recursion_limit() {
        let nest = |depth: usize, value: &str| {
            format!("{}{value}{}", r#"{"a":"#.repeat(depth), "}".repeat(depth))
        };
        let within = nest(100, r#""x"y""#);
        let candidates: Vec<_> = enumerate_quote_candidates(&within, Budgets::default()).collect();
        assert_eq!(candidates.len(), 1, "100 层嵌套应产出引号修复候选");
        assert_eq!(candidates[0].escapes, 1);

        let beyond = nest(130, r#""x"y""#);
        let candidates: Vec<_> = enumerate_quote_candidates(&beyond, Budgets::default()).collect();
        assert!(candidates.is_empty(), "130 层嵌套应被剪枝");
        assert!(
            serde_json::from_str::<Value>(&nest(130, r#""x\"y""#)).is_err(),
            "剪枝前提：serde_json 拒绝超过递归上限的嵌套"
        );
    }
}
