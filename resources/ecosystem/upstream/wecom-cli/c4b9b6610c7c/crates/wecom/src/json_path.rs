#[derive(Debug, Clone)]
pub enum PathSegment {
    Key(String),
    Index(usize),
}

/// Convert a `PathSegment` slice to a dot-separated string.
///
/// - `Key` segments are joined by `.`
/// - `Index` segments are rendered as `[i]` appended to the previous segment
///
/// Example: `[Key("a"), Key("b")]` → `"a.b"`
/// Example: `[Key("a"), Index(0), Key("b")]` → `"a[0].b"`
pub fn segments_to_path(segments: &[PathSegment]) -> String {
    let mut out = String::new();
    for seg in segments {
        match seg {
            PathSegment::Key(k) => {
                if !out.is_empty() {
                    out.push('.');
                }
                out.push_str(k);
            }
            PathSegment::Index(i) => {
                out.push_str(&format!("[{i}]"));
            }
        }
    }
    out
}

/// 按路径从 JSON 中读取值（只读版本）
pub fn get_value_deep<'a>(
    object: &'a serde_json::Value,
    path: &[PathSegment],
) -> Option<&'a serde_json::Value> {
    let mut current = object;
    for seg in path {
        match seg {
            PathSegment::Key(key) => {
                current = current.get(key.as_str())?;
            }
            PathSegment::Index(idx) => {
                current = current.as_array()?.get(*idx)?;
            }
        }
    }
    Some(current)
}

/// Recursively flatten a JSON value into dot-separated key → string value pairs.
///
/// Every leaf (string, number, boolean) is emitted as `(path, string_value)`.
/// Null values are skipped.
pub fn flatten_value(value: &serde_json::Value) -> Vec<(String, String)> {
    let mut out = Vec::new();
    flatten_value_inner(value, &mut vec![], &mut out);
    out
}

fn flatten_value_inner(
    value: &serde_json::Value,
    segments: &mut Vec<PathSegment>,
    out: &mut Vec<(String, String)>,
) {
    match value {
        serde_json::Value::Object(map) => {
            for (key, val) in map {
                segments.push(PathSegment::Key(key.clone()));
                flatten_value_inner(val, segments, out);
                segments.pop();
            }
        }
        serde_json::Value::Array(arr) => {
            for (i, val) in arr.iter().enumerate() {
                segments.push(PathSegment::Index(i));
                flatten_value_inner(val, segments, out);
                segments.pop();
            }
        }
        serde_json::Value::String(s) => {
            out.push((segments_to_path(segments), s.clone()));
        }
        serde_json::Value::Number(n) => {
            out.push((segments_to_path(segments), n.to_string()));
        }
        serde_json::Value::Bool(b) => {
            out.push((segments_to_path(segments), b.to_string()));
        }
        serde_json::Value::Null => {}
    }
}

/// 按路径设置 JSON 值。
/// 示例: path=[Key("a"), Index(0), Key("b")] → `payload["a"][0]["b"] = value`
pub fn set_value_deep(
    object: &mut serde_json::Value,
    path: &[PathSegment],
    value: serde_json::Value,
) {
    let mut current = object;
    for (i, seg) in path.iter().enumerate() {
        let is_last = i == path.len() - 1;

        match seg {
            PathSegment::Index(idx) => {
                if is_last {
                    let Some(arr) = current.as_array_mut() else {
                        return;
                    };
                    if *idx < arr.len() {
                        arr[*idx] = value;
                    }
                    return;
                }
                current = match current.as_array_mut().and_then(|arr| arr.get_mut(*idx)) {
                    Some(v) => v,
                    None => return,
                };
            }
            PathSegment::Key(key) => {
                if is_last {
                    if let Some(obj) = current.as_object_mut() {
                        obj.insert(key.clone(), value);
                    }
                    return;
                }
                current = match current.get_mut(key.as_str()) {
                    Some(v) => v,
                    None => return,
                };
            }
        }
    }
}

/// `segments_to_path` 的逆运算：把 `"a.b[0].c"` 解析为段序列。
///
/// 语法非法（未闭合 `[`、空段、非法字符、非法下标）返回 `Err`，
/// 错误消息仅包含具体原因，不重复输入路径（由调用方补充上下文）。
pub fn parse_path(s: &str) -> Result<Vec<PathSegment>, String> {
    if s.is_empty() {
        return Err("路径为空".into());
    }

    let mut segments = Vec::new();
    let mut chars = s.chars().peekable();
    let mut first = true;

    loop {
        let ch = chars.peek().copied();
        match ch {
            None => break,
            Some('.') => {
                if first {
                    // 忽略前导 `.`：`.a.b` ≡ `a.b`
                    chars.next();
                    first = false;
                    continue;
                }
                chars.next(); // consume '.'
                segments.push(PathSegment::Key(parse_key(&mut chars)?));
            }
            Some('[') => {
                if first {
                    return Err("路径不能以 '[' 开头".into());
                }
                chars.next(); // consume '['
                let idx = parse_index(&mut chars)?;
                // expect ']'
                match chars.next() {
                    Some(']') => {}
                    Some(c) => {
                        return Err(format!("下标缺少 ']'，得到 '{c}'"));
                    }
                    None => {
                        return Err("下标未闭合，缺少 ']'".into());
                    }
                }
                segments.push(PathSegment::Index(idx));
            }
            Some(c) if is_key_char(c) => {
                segments.push(PathSegment::Key(parse_key(&mut chars)?));
            }
            Some(c) => {
                return Err(format!("路径包含非法字符 '{c}'"));
            }
        }
        first = false;
    }

    if segments.is_empty() {
        return Err("路径为空".into());
    }
    Ok(segments)
}

fn is_key_char(c: char) -> bool {
    c.is_ascii_alphanumeric() || c == '_'
}

fn parse_key(chars: &mut std::iter::Peekable<std::str::Chars<'_>>) -> Result<String, String> {
    // 首字符必须为字母或下划线
    if let Some(&c) = chars.peek()
        && !c.is_ascii_alphabetic()
        && c != '_'
    {
        return Err(format!("键名必须以字母或下划线开头，得到 `{c}`"));
    }
    let mut key = String::new();
    while let Some(&c) = chars.peek() {
        if is_key_char(c) {
            key.push(c);
            chars.next();
        } else {
            break;
        }
    }
    if key.is_empty() {
        return Err("键名为空".into());
    }
    Ok(key)
}

fn parse_index(chars: &mut std::iter::Peekable<std::str::Chars<'_>>) -> Result<usize, String> {
    let mut digits = String::new();
    while let Some(&c) = chars.peek() {
        if c.is_ascii_digit() {
            digits.push(c);
            chars.next();
        } else {
            break;
        }
    }
    if digits.is_empty() {
        return Err("下标为空".into());
    }
    digits
        .parse::<usize>()
        .map_err(|e| format!("非法下标 '{digits}': {e}"))
}

/// 带 auto-vivification 的写入：按需创建中间容器后写值。
///
/// - Key 段：确保当前节点是 object（缺则建 `{}`），插入 / 下潜。
/// - Index 段：确保当前节点是 array（缺则建 `[]`），不足则用 `Null` 补齐到 idx。
/// - 中间节点已存在但类型冲突（需要 object 却是标量等）→ `Err`（含冲突段位）。
pub fn upsert_value_deep(
    root: &mut serde_json::Value,
    path: &[PathSegment],
    value: serde_json::Value,
) -> Result<(), String> {
    if path.is_empty() {
        *root = value;
        return Ok(());
    }

    let mut current = root;
    for (i, seg) in path.iter().enumerate() {
        let is_last = i == path.len() - 1;

        match seg {
            PathSegment::Index(idx) => {
                // Auto-vivify Null → Array（array padding 会产生 null 元素）
                if current.is_null() {
                    *current = serde_json::Value::Array(Vec::new());
                }
                let arr = current.as_array_mut().ok_or_else(|| {
                    let cur_path = segments_to_path(&path[..=i]);
                    format!("访问 '{cur_path}' 失败: 目标节点不是数组")
                })?;

                if arr.len() <= *idx {
                    arr.resize(*idx + 1, serde_json::Value::Null);
                }

                if is_last {
                    arr[*idx] = value;
                    return Ok(());
                }
                // 中间节点：留下 Null 占位，交由下一轮按其段类型 auto-vivify。
                current = &mut arr[*idx];
            }
            PathSegment::Key(key) => {
                // Auto-vivify Null → Object
                if current.is_null() {
                    *current = serde_json::json!({});
                }
                let obj = current.as_object_mut().ok_or_else(|| {
                    let cur_path = segments_to_path(&path[..=i]);
                    format!("访问 '{cur_path}' 失败: 目标节点不是对象")
                })?;

                if is_last {
                    obj.insert(key.clone(), value);
                    return Ok(());
                }
                // 中间节点：缺失键塞入 Null 占位，交由下一轮 auto-vivify。
                current = obj.entry(key.clone()).or_insert(serde_json::Value::Null);
            }
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    //! ## 模块摘要：json_path（JSON Path 操作）
    //!
    //! ### 关键接口
    //! - [json_path::segments_to_path] — 将 PathSegment 切片转换为点分隔路径字符串
    //! - [json_path::parse_path] — `segments_to_path` 的逆运算，解析路径字符串为段序列
    //! - [json_path::get_value_deep] — 按路径从 JSON 中只读获取值
    //! - [json_path::flatten_value] — 递归将 JSON 扁平化为 (path, string_value) 键值对
    //! - [json_path::set_value_deep] — 按路径设置/修改 JSON 值（中间节点不存在则 noop）
    //! - [json_path::upsert_value_deep] — 带 auto-vivification 的写入（中间节点不存在则创建）
    //!
    //! ### 关键分支与异常路径
    //! - Key 段拼接时非首段前加点号，Index 段用方括号
    //! - parse_path：空路径/非法字符/未闭合方括号/空键/空下标 → Err
    //! - get_value_deep：键不存在 / 数组索引越界 → 返回 None；空路径返回根引用
    //! - flatten_value：Object/Array 递归遍历；Null 被跳过；String/Number/Bool 作为叶子输出
    //! - set_value_deep：中间节点不存在 → noop；数组索引越界 → noop；目标非 Object/Array → noop
    //! - upsert_value_deep：按需创建 object/array；数组补齐 null 空洞；类型冲突报错
    //!
    //! ### 上下游交互
    //! - 上游：`directive/file_save`、`directive/collect`、`directive/octet_stream` 使用本模块操作 JSON；
    //!   `--set` 深层参数赋值使用 parse_path + upsert_value_deep
    //! - 下游：依赖 serde_json::Value 数据结构

    use assert_json_diff::assert_json_eq;
    use serde_json::json;

    use super::*;

    // ── segments_to_path ──

    /// P1：[segments_to_path] 空路径段列表转换为空字符串
    /// 条件：传入空切片 &[]
    /// 断言：结果为空字符串 ""
    #[test]
    fn segments_to_path_empty() {
        assert_eq!(segments_to_path(&[]), "");
    }

    /// P0：[segments_to_path] 单个 Key 段转换为对应的键名字符串
    /// 条件：传入单个 Key("name") 的 segments
    /// 断言：结果为 "name"
    #[test]
    fn segments_to_path_single_key() {
        assert_eq!(segments_to_path(&[PathSegment::Key("name".into())]), "name");
    }

    /// P0：[segments_to_path] 多个 Key 段以点号连接为嵌套路径
    /// 条件：传入 [Key("a"), Key("b")]
    /// 断言：结果为 "a.b"
    #[test]
    fn segments_to_path_nested_keys() {
        assert_eq!(
            segments_to_path(&[PathSegment::Key("a".into()), PathSegment::Key("b".into()),]),
            "a.b"
        );
    }

    /// P0：[segments_to_path] 混合 Key 和 Index 段的正确拼接
    /// 条件：传入 [Key("items"), Index(0), Key("name")]
    /// 断言：结果为 "items[0].name"
    #[test]
    fn segments_to_path_with_index() {
        assert_eq!(
            segments_to_path(&[
                PathSegment::Key("items".into()),
                PathSegment::Index(0),
                PathSegment::Key("name".into()),
            ]),
            "items[0].name"
        );
    }

    /// P1：[segments_to_path] 连续 Index 段以方括号级联拼接
    /// 条件：传入 [Key("matrix"), Index(1), Index(2)]
    /// 断言：结果为 "matrix[1][2]"
    #[test]
    fn segments_to_path_consecutive_indexes() {
        assert_eq!(
            segments_to_path(&[
                PathSegment::Key("matrix".into()),
                PathSegment::Index(1),
                PathSegment::Index(2),
            ]),
            "matrix[1][2]"
        );
    }

    // ── get_value_deep ──

    /// P0：[get_value_deep] 空路径返回 JSON 根对象本身
    /// 条件：JSON 为 {"a": 1}，路径为空切片
    /// 断言：返回值等于原始 Value 引用
    #[test]
    fn get_value_deep_root() {
        let val = json!({"a": 1});
        let result = get_value_deep(&val, &[]).unwrap();
        assert_json_eq!(result, &val);
    }

    /// P0：[get_value_deep] 按多层嵌套键路径读取值
    /// 条件：JSON 为 {"a": {"b": {"c": 42}}}，路径为 a.b.c
    /// 断言：返回值为 42
    #[test]
    fn get_value_deep_nested_key() {
        let val = json!({"a": {"b": {"c": 42}}});
        let path = [
            PathSegment::Key("a".into()),
            PathSegment::Key("b".into()),
            PathSegment::Key("c".into()),
        ];
        let result = get_value_deep(&val, &path).unwrap();
        assert_json_eq!(result, &json!(42));
    }

    /// P0：[get_value_deep] 通过键+数组索引路径正确读取元素值
    /// 条件：JSON 为 {"items": [10, 20, 30]}，路径为 items[1]
    /// 断言：返回值为 20
    #[test]
    fn get_value_deep_array_index() {
        let val = json!({"items": [10, 20, 30]});
        let path = [PathSegment::Key("items".into()), PathSegment::Index(1)];
        let result = get_value_deep(&val, &path).unwrap();
        assert_json_eq!(result, &json!(20));
    }

    /// P1：[get_value_deep] 访问不存在的键返回 None
    /// 条件：JSON 为 {"a": 1}，路径为 nonexistent
    /// 断言：结果为 None
    #[test]
    fn get_value_deep_missing_key() {
        let val = json!({"a": 1});
        let path = [PathSegment::Key("nonexistent".into())];
        assert_eq!(get_value_deep(&val, &path), None);
    }

    /// P1：[get_value_deep] 数组索引越界时返回 None
    /// 条件：JSON 中 arr 为 [1]，路径为 arr[5]
    /// 断言：结果为 None
    #[test]
    fn get_value_deep_out_of_bounds() {
        let val = json!({"arr": [1]});
        let path = [PathSegment::Key("arr".into()), PathSegment::Index(5)];
        assert_eq!(get_value_deep(&val, &path), None);
    }

    // ── flatten_value ──

    /// P0：[flatten_value] 简单对象的扁平化输出包含所有叶子键值对
    /// 条件：JSON 为 {"name": "alice", "age": 30}
    /// 断言：结果同时包含 ("name", "alice") 和 ("age", "30")
    #[test]
    fn flatten_value_simple_object() {
        let val = json!({"name": "alice", "age": 30});
        let result = flatten_value(&val);
        assert!(result.contains(&("name".into(), "alice".into())));
        assert!(result.contains(&("age".into(), "30".into())));
    }

    /// P0：[flatten_value] 嵌套对象扁平化时路径以点号连接
    /// 条件：JSON 为 {"user": {"name": "bob"}}
    /// 断言：结果为 [("user.name", "bob")]
    #[test]
    fn flatten_value_nested() {
        let val = json!({"user": {"name": "bob"}});
        let result = flatten_value(&val);
        assert_eq!(result, vec![("user.name".into(), "bob".into())]);
    }

    /// P1：[flatten_value] 数组元素的扁平化路径使用索引方括号表示
    /// 条件：JSON 为 {"tags": ["a", "b"]}
    /// 断言：结果为 [("tags[0]", "a"), ("tags[1]", "b")]
    #[test]
    fn flatten_value_array() {
        let val = json!({"tags": ["a", "b"]});
        let result = flatten_value(&val);
        assert_eq!(
            result,
            vec![
                ("tags[0]".into(), "a".into()),
                ("tags[1]".into(), "b".into())
            ]
        );
    }

    /// P1：[flatten_value] 布尔值的扁平化输出为字符串 "true"/"false"
    /// 条件：JSON 为 {"active": true}
    /// 断言：结果为 [("active", "true")]
    #[test]
    fn flatten_value_bool() {
        let val = json!({"active": true});
        let result = flatten_value(&val);
        assert_eq!(result, vec![("active".into(), "true".into())]);
    }

    /// P1：[flatten_value] Null 值在扁平化时被跳过
    /// 条件：JSON 为 {"a": null, "b": "ok"}
    /// 断言：结果仅包含 ("b", "ok")，不包含 a
    #[test]
    fn flatten_value_null_skipped() {
        let val = json!({"a": null, "b": "ok"});
        let result = flatten_value(&val);
        assert_eq!(result, vec![("b".into(), "ok".into())]);
    }

    /// P1：[flatten_value] 空对象扁平化结果为空列表
    /// 条件：JSON 为 {}
    /// 断言：返回空 Vec
    #[test]
    fn flatten_value_empty_object() {
        assert!(flatten_value(&json!({})).is_empty());
    }

    // ── set_value_deep ──

    /// P0：[set_value_deep] 对顶层键设置新值覆盖原值
    /// 条件：JSON 为 {"a": 1}，设置路径 a 的值为 99
    /// 断言：结果为 {"a": 99}
    #[test]
    fn set_value_deep_top_level_key() {
        let mut val = json!({"a": 1});
        set_value_deep(&mut val, &[PathSegment::Key("a".into())], json!(99));
        assert_json_eq!(val, json!({"a": 99}));
    }

    /// P1：向对象插入不存在的键
    /// 条件：JSON 为 {"a": 1}，设置路径 b 的值为 "new"
    /// 断言：结果为 {"a": 1, "b": "new"}
    #[test]
    fn set_value_deep_insert_new_key() {
        let mut val = json!({"a": 1});
        set_value_deep(&mut val, &[PathSegment::Key("b".into())], json!("new"));
        assert_json_eq!(val, json!({"a": 1, "b": "new"}));
    }

    /// P0：对嵌套路径设置值正确更新目标字段
    /// 条件：JSON 为 {"a": {"b": 1}}，路径为 a.b，值为 42
    /// 断言：结果为 {"a": {"b": 42}}
    #[test]
    fn set_value_deep_nested() {
        let mut val = json!({"a": {"b": 1}});
        set_value_deep(
            &mut val,
            &[PathSegment::Key("a".into()), PathSegment::Key("b".into())],
            json!(42),
        );
        assert_json_eq!(val, json!({"a": {"b": 42}}));
    }

    /// P1：[set_value_deep] 通过数组索引路径修改数组元素
    /// 条件：JSON 中 arr 为 [10,20,30]，设置 arr[1] = 99
    /// 断言：arr 变为 [10,99,30]
    #[test]
    fn set_value_deep_array_element() {
        let mut val = json!({"arr": [10, 20, 30]});
        set_value_deep(
            &mut val,
            &[PathSegment::Key("arr".into()), PathSegment::Index(1)],
            json!(99),
        );
        assert_json_eq!(val, json!({"arr": [10, 99, 30]}));
    }

    /// P1：[set_value_deep] 中间节点不存在时设置操作不产生副作用
    /// 条件：JSON 为 {"a": 1}，尝试设置 x.y 路径（x 不存在）
    /// 断言：原 JSON 值不变
    #[test]
    fn set_value_deep_missing_intermediate_is_noop() {
        let mut val = json!({"a": 1});
        set_value_deep(
            &mut val,
            &[PathSegment::Key("x".into()), PathSegment::Key("y".into())],
            json!(42),
        );
        // unchanged
        assert_json_eq!(val, json!({"a": 1}));
    }

    /// P1：[set_value_deep] 数组索引越界时设置操作不产生副作用
    /// 条件：JSON 中 arr 仅1个元素，尝试设置 arr[5]
    /// 断言：原 JSON 值不变
    #[test]
    fn set_value_deep_index_out_of_bounds_is_noop() {
        let mut val = json!({"arr": [1]});
        set_value_deep(
            &mut val,
            &[PathSegment::Key("arr".into()), PathSegment::Index(5)],
            json!(99),
        );
        assert_json_eq!(val, json!({"arr": [1]}));
    }

    /// P1：[set_value_deep] 对非对象值（字符串）设置键不产生副作用
    /// 条件：JSON 为纯字符串 "just a string"，尝试设置路径 a
    /// 断言：原值不变
    #[test]
    fn set_value_deep_on_non_object_is_noop() {
        let mut val = json!("just a string");
        set_value_deep(&mut val, &[PathSegment::Key("a".into())], json!(1));
        assert_json_eq!(val, json!("just a string"));
    }

    // ── parse_path ──

    /// P0：[parse_path] 单个键名解析为单段 Key
    /// 条件：输入 "begintime"
    /// 断言：返回 [Key("begintime")]
    #[test]
    fn parse_path_single_key() {
        let segs = parse_path("begintime").unwrap();
        assert_eq!(segs.len(), 1);
        match &segs[0] {
            PathSegment::Key(k) => assert_eq!(k, "begintime"),
            _ => panic!("expected Key"),
        }
    }

    /// P0：[parse_path] 深层混合点与下标路径解析为正确的段序列
    /// 条件：输入 "grid_data.rows[0].values[0].text"
    /// 断言：返回 6 段，Key/Idx 交替正确
    #[test]
    fn parse_path_deep_mixed() {
        let segs = parse_path("grid_data.rows[0].values[0].text").unwrap();
        assert_eq!(segs.len(), 6);
        match &segs[0] {
            PathSegment::Key(k) => assert_eq!(k, "grid_data"),
            _ => panic!("expected Key"),
        }
        match &segs[1] {
            PathSegment::Key(k) => assert_eq!(k, "rows"),
            _ => panic!("expected Key"),
        }
        match &segs[2] {
            PathSegment::Index(i) => assert_eq!(*i, 0),
            _ => panic!("expected Index"),
        }
        match &segs[3] {
            PathSegment::Key(k) => assert_eq!(k, "values"),
            _ => panic!("expected Key"),
        }
        match &segs[4] {
            PathSegment::Index(i) => assert_eq!(*i, 0),
            _ => panic!("expected Index"),
        }
        match &segs[5] {
            PathSegment::Key(k) => assert_eq!(k, "text"),
            _ => panic!("expected Key"),
        }
    }

    /// P0：[parse_path] 仅下标尾段的路径正确解析
    /// 条件：输入 "tags[2]"
    /// 断言：返回 [Key("tags"), Idx(2)]
    #[test]
    fn parse_path_index_tail() {
        let segs = parse_path("tags[2]").unwrap();
        assert_eq!(segs.len(), 2);
        match &segs[0] {
            PathSegment::Key(k) => assert_eq!(k, "tags"),
            _ => panic!("expected Key"),
        }
        match &segs[1] {
            PathSegment::Index(i) => assert_eq!(*i, 2),
            _ => panic!("expected Index"),
        }
    }

    /// P1：[parse_path] 未闭合方括号返回 Err
    /// 条件：输入 "a[0"
    /// 断言：返回 Err
    #[test]
    fn parse_path_unclosed_bracket() {
        assert!(parse_path("a[0").is_err());
    }

    /// P1：[parse_path] 中间有空键段返回 Err；前导 `.` 被忽略
    /// 条件：输入 "a..b"（中间空键段）和 ".a"（前导点）
    /// 断言："a..b"→Err；".a"→[Key("a")]
    #[test]
    fn parse_path_empty_key() {
        assert!(parse_path("a..b").is_err());
        let segs = parse_path(".a").unwrap();
        assert_eq!(segs.len(), 1);
        match &segs[0] {
            PathSegment::Key(k) => assert_eq!(k, "a"),
            _ => panic!("expected Key"),
        }
    }

    /// P1：[parse_path] 非法下标返回 Err
    /// 条件：输入 "a[x]" 和 "a[-1]"
    /// 断言：均返回 Err
    #[test]
    fn parse_path_invalid_index() {
        assert!(parse_path("a[x]").is_err());
        assert!(parse_path("a[-1]").is_err());
    }

    /// P0：[parse_path] 与 segments_to_path 的往返正确性
    /// 条件：对 "a.b[0].c" 执行 parse → segments_to_path
    /// 断言：还原为 "a.b[0].c"
    #[test]
    fn parse_path_roundtrip() {
        let original = "a.b[0].c";
        let segs = parse_path(original).unwrap();
        let roundtrip = segments_to_path(&segs);
        assert_eq!(roundtrip, original);
    }

    // ── upsert_value_deep ──

    /// P0：[upsert_value_deep] 空对象上建深层标量
    /// 条件：root 为 {}，路径 a.b[0].c，值为 "x"
    /// 断言：结果为 {"a":{"b":[{"c":"x"}]}}
    #[test]
    fn upsert_deep_scalar_on_empty() {
        let mut root = json!({});
        let path = parse_path("a.b[0].c").unwrap();
        upsert_value_deep(&mut root, &path, json!("x")).unwrap();
        assert_json_eq!(root, json!({"a": {"b": [{"c": "x"}]}}));
    }

    /// P0：[upsert_value_deep] 数组补齐空洞
    /// 条件：root 为 {}，路径 tags[2]，值为 "x"
    /// 断言：结果为 {"tags":[null,null,"x"]}
    #[test]
    fn upsert_array_padding() {
        let mut root = json!({});
        let path = parse_path("tags[2]").unwrap();
        upsert_value_deep(&mut root, &path, json!("x")).unwrap();
        assert_json_eq!(root, json!({"tags": [null, null, "x"]}));
    }

    /// P0：[upsert_value_deep] 覆盖既有标量
    /// 条件：已有 {"a":1}，设置 a=2
    /// 断言：结果为 {"a":2}
    #[test]
    fn upsert_overwrite_scalar() {
        let mut root = json!({"a": 1});
        let path = parse_path("a").unwrap();
        upsert_value_deep(&mut root, &path, json!(2)).unwrap();
        assert_json_eq!(root, json!({"a": 2}));
    }

    /// P1：[upsert_value_deep] 子树后补字段不清除兄弟键
    /// 条件：先对空对象执行 upsert a={"x":1}，再 upsert a.y=2
    /// 断言：结果为 {"a":{"x":1,"y":2}}
    #[test]
    fn upsert_subtree_then_scalar() {
        let mut root = json!({});
        // 先建子树
        let path1 = parse_path("a").unwrap();
        upsert_value_deep(&mut root, &path1, json!({"x": 1})).unwrap();
        // 再补标量
        let path2 = parse_path("a.y").unwrap();
        upsert_value_deep(&mut root, &path2, json!(2)).unwrap();
        assert_json_eq!(root, json!({"a": {"x": 1, "y": 2}}));
    }

    /// P1：[upsert_value_deep] 类型冲突返回 Err
    /// 条件：已有 {"a":1}，尝试设置 a.b=2
    /// 断言：返回 Err（a 非 object）
    #[test]
    fn upsert_type_conflict_scalar_to_object() {
        let mut root = json!({"a": 1});
        let path = parse_path("a.b").unwrap();
        let err = upsert_value_deep(&mut root, &path, json!(2)).unwrap_err();
        let msg = err.to_string();
        assert!(msg.contains("目标节点不是对象"), "got: {msg}");
    }

    /// P1：[upsert_value_deep] 数组类型冲突返回 Err
    /// 条件：已有 {"a": [1]}，尝试设置 a[0].b=2
    /// 断言：返回 Err（数组元素是数字非 object）
    #[test]
    fn upsert_type_conflict_array_element_not_object() {
        let mut root = json!({"a": [1]});
        let path = parse_path("a[0].b").unwrap();
        let err = upsert_value_deep(&mut root, &path, json!(2)).unwrap_err();
        let msg = err.to_string();
        assert!(msg.contains("目标节点不是对象"), "got: {msg}");
    }

    // ── parse_path P2 边界 ──

    /// P2：[parse_path] 空字符串直接返回 Err
    /// 条件：输入 ""
    /// 断言：返回 Err 且包含"路径为空"
    #[test]
    fn parse_path_empty_string() {
        let err = parse_path("").unwrap_err();
        assert!(err.to_string().contains("路径为空"));
    }

    /// P2：[parse_path] 仅含前导点号（无实际键名）返回 Err
    /// 条件：输入 "."
    /// 断言：返回 Err 且包含"路径为空"
    #[test]
    fn parse_path_leading_dot_only() {
        let err = parse_path(".").unwrap_err();
        assert!(err.to_string().contains("路径为空"));
    }

    /// P2：[parse_path] 纯数字键名（非字母/下划线开头）返回 Err
    /// 条件：输入 "123"
    /// 断言：返回 Err（键名必须以字母或下划线开头）
    #[test]
    fn parse_path_digits_only_key() {
        assert!(parse_path("123").is_err());
    }

    /// P0：[parse_path] 下划线开头的键名合法
    /// 条件：输入 "_private_key"
    /// 断言：返回 [Key("_private_key")]
    #[test]
    fn parse_path_underscore_prefix_key() {
        let segs = parse_path("_private_key").unwrap();
        assert_eq!(segs.len(), 1);
        match &segs[0] {
            PathSegment::Key(k) => assert_eq!(k, "_private_key"),
            _ => panic!("expected Key"),
        }
    }

    /// P2：[parse_path] 键名中包含连字符 `-` 视为非法字符返回 Err
    /// 条件：输入 "a-b"
    /// 断言：返回 Err（`-` 非合法键名字符，在 path 层作为非法字符）
    #[test]
    fn parse_path_hyphen_in_key_is_err() {
        assert!(parse_path("a-b").is_err());
    }

    /// P2：[parse_path] 路径以 `.` 结尾返回 Err
    /// 条件：输入 "a."
    /// 断言：返回 Err（末尾点后键名为空）
    #[test]
    fn parse_path_trailing_dot() {
        assert!(parse_path("a.").is_err());
    }

    /// P2：[parse_path] 方括号内非数字字符返回 Err
    /// 条件：输入 "a[abc]"
    /// 断言：返回 Err
    #[test]
    fn parse_path_non_digit_in_brackets() {
        assert!(parse_path("a[abc]").is_err());
    }

    /// P2：[parse_path] 多个连续点号包含空键段返回 Err
    /// 条件：输入 "a...b"
    /// 断言：返回 Err（中间有空键段）
    #[test]
    fn parse_path_multiple_consecutive_dots() {
        assert!(parse_path("a...b").is_err());
    }

    /// P2：[parse_path] 路径中含有非法特殊字符返回 Err
    /// 条件：输入 "a@b"
    /// 断言：返回 Err 且包含"非法字符"
    #[test]
    fn parse_path_special_char() {
        let err = parse_path("a@b").unwrap_err();
        assert!(err.to_string().contains("非法字符"));
    }

    /// P2：[parse_path] `]` 后的合法字符作为下一个 Key 段
    /// 条件：输入 "a[0]x"
    /// 断言：返回 [Key("a"), Index(0), Key("x")]
    #[test]
    fn parse_path_content_after_bracket() {
        let segs = parse_path("a[0]x").unwrap();
        assert_eq!(segs.len(), 3);
        match &segs[0] {
            PathSegment::Key(k) => assert_eq!(k, "a"),
            _ => panic!("expected Key"),
        }
        match &segs[1] {
            PathSegment::Index(i) => assert_eq!(*i, 0),
            _ => panic!("expected Index"),
        }
        match &segs[2] {
            PathSegment::Key(k) => assert_eq!(k, "x"),
            _ => panic!("expected Key"),
        }
    }

    // ── upsert_value_deep P2 边界 ──

    /// P2：[upsert_value_deep] 空路径替换整个 root 值
    /// 条件：root 为 {}，path 为空，value 为 42
    /// 断言：root 变为 42
    #[test]
    fn upsert_empty_path_replaces_root() {
        let mut root = json!({});
        upsert_value_deep(&mut root, &[], json!(42)).unwrap();
        assert_json_eq!(root, json!(42));
    }

    /// P2：[upsert_value_deep] Null 中间节点被 Key 段驱动 auto-vivify 为 Object
    /// 条件：已有 {"null_key": null}，尝试设置 null_key.sub=1
    /// 断言：null_key 变为 {"sub": 1}
    #[test]
    fn upsert_null_intermediate_vivifies_to_object() {
        let mut root = json!({"null_key": null});
        let path = parse_path("null_key.sub").unwrap();
        upsert_value_deep(&mut root, &path, json!(1)).unwrap();
        assert_json_eq!(root, json!({"null_key": {"sub": 1}}));
    }

    /// P2：[upsert_value_deep] Null 中间节点被 Index 段驱动 auto-vivify 为 Array
    /// 条件：已有 {"arr": null}，尝试设置 arr[0]=1
    /// 断言：arr 变为 [1]
    #[test]
    fn upsert_null_intermediate_vivifies_to_array() {
        let mut root = json!({"arr": null});
        let path = parse_path("arr[0]").unwrap();
        upsert_value_deep(&mut root, &path, json!(1)).unwrap();
        assert_json_eq!(root, json!({"arr": [1]}));
    }
}
