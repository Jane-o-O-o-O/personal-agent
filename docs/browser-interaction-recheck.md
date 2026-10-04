# 浏览器操作复查

日期：2026-10-04。用户反馈涉及画面更新、点击与输入、Agent 执行和人工交接。本轮扩大了之前的验收场景，包含普通物理键盘、双击、鼠标拖动、连续滚轮以及尚未结束的 Agent 单元切换标签。

**本轮复测已完成，修复已部署到 VPS。** 最终源码通过 166 项单元/服务集成、27 项隔离网页测试和 31 项公网检查。下文保留修复前失败和中间诊断；此前报告的通过数字只适用于当时的场景和版本。

## 已复现的问题

使用公网工作台操作 VPS 内的真实 Chromium，测试网页每 80ms 更新一次可见计数器。独立 CDP 连接读取实际 DOM 和网页事件，避免用接口返回成功代替操作效果。

| 场景 | 修复前实际结果 |
| --- | --- |
| 输入 `personal-agent-123` | 文字存在，但 `keydown`、`keyup` 均为 0；网页键盘监听器没有得到事件 |
| 物理 Tab | 焦点去了本地工作台，远程网页没有收到 Tab |
| 双击 | 远程网页的 `dblclick` 为 0 |
| 鼠标拖动 | 远程网页没有收到按住鼠标的移动，拖动计数为 0 |
| 连续 40 个滚轮事件后交回控制 | 发送了 40 个串行 HTTP 请求，完整场景约 6 秒 |
| Agent 新开标签并执行较长单元 | 单元仍在执行时画面留在旧标签，结束后才跟随 |

这次样本收到 154 条画面/状态消息，消息间隔中位数 99ms、95 分位 463ms；68 个输入请求的耗时中位数 114.5ms、95 分位 202ms。上述数据用于定位本次队列积压，不是视频帧率或稳定性能保证。

用户此前的豆瓣查询还暴露了任务状态问题：`browser_observe` 因人工控制失败，助手要求交回控制，但宿主把这轮正常回复记成了“已完成”。查询没有取得电影榜单结果。

修复前六项失败保留在 [`baseline.json`](../.runtime/browser-recheck/baseline.json)。首次修复版的中间公网运行有六项通过，拖动仍失败，整个运行 `passed=false`；见 [`final-initial.json`](../.runtime/browser-recheck/final-initial.json)。这些记录保留原断言，不改为跳过，也不把文件名中的 `final` 当成最终通过。

## 修复机制

### 物理键盘、Tab 和 Mac 全选

工作台聚焦远程画面时，物理按键传递 `key`、`code`、修饰键和可输入字符。后端依次发送 `rawKeyDown`、必要的 `char` 和 `keyUp`，使普通文字输入同时到达网页键盘监听器。Tab 阻止本地工作台的默认焦点切换，并交给远程 Chromium 执行；Shift+Tab 也保留其修饰键。

Mac 的 Command 编辑快捷键在非 macOS 的 VPS 上映射为 Control；全选还携带 CDP 的 `selectAll` 编辑命令。因此 Cmd+A 的目标是当前远程输入框，不是本地图片或整张工作台。粘贴读取用户本地发起的纯文本事件，不能依赖 VPS 的系统剪贴板。

中文输入栏和批量粘贴继续以文字为主：前面的字符使用 `Input.insertText`，最后字符通过 `keyDown/keyUp` 发送，使依赖最后一次按键的联想监听器可响应。这没有模拟逐个中文字符的完整物理键盘或 IME composition 生命周期。

### 指针按下、移动、释放与双击

输入协议新增 `mouse_down`、`mouse_up`，保留 `move` 并传递 `button`、`buttons`、`clickCount`。前端对鼠标手势设置 pointer capture，按同一标签和 generation 发送连续操作；双击携带对应点击次数，而不是重复两次孤立的单击。

拖动移动事件除了 `buttons` 掩码，还明确带正在按住的 `button`。独立 VPS 原生 CDP 对比中，只带掩码的移动丢失拖动元素的 pointer capture，拖动计数为 0；带 held button 时移动事件继续命中拖动元素，计数为 1，元素位置改变。证据：[`native-vps-pointer-button.json`](../.runtime/browser-recheck/native-vps-pointer-button.json)。该探针确认这个机制，不代替修复版完整工作台验收。

前后端跟踪按住状态。切换文档、标签或控制权，手势取消、失去捕获、组件卸载或输入失败时释放或清理；队列为 `mouse_up` 预留空间，避免突发输入占满后丢掉释放。旧 generation 的释放也不能借用新控制权操作新页面。

最后审查还补充了卸载边界：组件卸载会取消排队的普通输入，但保留已经排队的 `mouse_up`，并在当前手势仍匹配标签和 generation 时补充释放。卸载后的派发只允许这类清理释放，仍复核 owner/标签/版本；不能把取消队列变成远程鼠标永久按住。队列单测和协议 E2E 已验证“按下已发出、移动挂起、释放排队后立刻卸载”的组合。

### 滚轮队列与画面解码

相邻且相同标签、generation、修饰键、位置的滚轮累加，连续且按键掩码相同的指针移动只保留最后位置；键盘、点击、鼠标按下和释放保持顺序，不能跨这些边界合并。导航和交接等待队列排空，每条真正发出的输入仍复核控制权。

中间运行中的 40 次滚轮合并为 1 个滚动请求，实际 `scrollY=800`，交回耗时 859 ms；这只是该样本，尚不作为最终性能数字。修复前对应场景发送 40 个串行请求、约 6 秒，原失败保留。

同一页面保留上一张已解码画面，后台解码较新画面，避免每次新帧到达时暂时禁用输入。只有同一 owner、generation、标签和文档的有效已解码画面可操作；换标签、换文档、断线和旧控制版本仍禁止输入。

已收到更高 generation 的原始帧时，即使新图尚未解码、状态通知尚未补齐，也立即以观察到的最高版本阻断旧代输入。检查既发生在入队前，也发生在真正派发时；后台双缓冲只允许同代画面的连续操作，不能让旧解码图在新一代已经到达后继续接收点击。协议 E2E 已覆盖状态和解码都延迟时拒绝旧代输入及旧帧回退。

### worker 焦点 IPC 与长单元标签跟随

worker 在实际标签选择或浏览器操作时发送独立 `focus` IPC，不再依赖录像开关和单元完成通知。运行时首先确认消息来自当前 worker，宿主再确认当前运行时、当前任务及 owner 为 agent，才更新活动标签并激活真实 Chromium target。

单元结束后自动附带的观察不会把视图拉回主页面。取消或重置后的旧 worker 也不能通过迟到通知切换用户正在操作的标签。最终公网检查在 5 秒 cell 开始后约 1.8 秒读取状态，确认活动 target 已切换而 cell 尚未结束。

### Pi 等待人工交回，避免误判任务完成

受控制权约束的 `browser_observe`、`browser_navigate`、`browser_execute` 明确返回 `BROWSER_NOT_OWNED` 时，运行器记录等待控制状态。若随后没有成功完成受控浏览器操作，这轮模型即使正常回复“请交回”，宿主也进入 `waiting_user / browser_control`，不写成功结果或完成时间，并保留持久 Pi 会话。该判断依据工具错误，不是对助手文字的关键词猜测；无关工具错误仍按原规则处理。

只读截图不转移 owner，也不清除上述等待标记。任务界面的“交回浏览器并继续任务”先读取权威浏览器和最新任务状态，若确为等待且仍由 user 控制，用当前 generation 释放浏览器，再用最新任务版本恢复。用户明确操作后才继续任务，不因一张截图或一段普通聊天回复自动交回。

最后审查发现，较早的控制权等待也可能掩盖随后出现的真实浏览器故障。修复版保存最近一次受控浏览器工具结果：明确 `BROWSER_NOT_OWNED` 记录等待，成功清除旧结果，其他故障替换旧等待并按故障处理。只读截图保持中立；不能用旧的 `waiting_user` 将后来的连接或执行失败隐藏成仍需交回。该覆盖关系纳入最终复测范围。

## 复测结果

最终公网五阶段于 **2026-10-04 16:16:47—16:20:59（Asia/Shanghai）** 串行完成，全部退出 0。JSON 使用 UTC；例如 `2026-10-04T08:16:47.103Z` 对应北京时间 16:16:47。

| 验证层级 | 最终结果 | 证据 |
| --- | --- | --- |
| 全项目单元与服务集成 | **166/166，22 文件**；失败/跳过 0，包含真实 Chromium PointerEvent capture 控件、队列和真实 Pi SDK 等待/故障优先级回归 | [`vitest-final.json`](../.runtime/browser-recheck/vitest-final.json) |
| 隔离网页端到端 | **27/27**；失败/跳过/重试 0，源码在运行期间未改变，临时目录和端口清理通过 | [`playwright-final.json`](../.runtime/browser-recheck/playwright-final.json) |
| 同场景公网复测 | **7/7**；物理文字、Tab、Mac 全选后中文输入、双击、拖动、滚轮及长 cell 标签跟随 | [`final.json`](../.runtime/browser-recheck/final.json) |
| 真实模型等待与界面恢复 | **2/2**；owner=user 时明确等待，点击交回按钮后同一 Pi 会话继续，原用户输入仅一次，页面错误 0 | [`model-wait.json`](../.runtime/browser-recheck/model-wait.json) |
| 公网真实 Chromium 常规交互 | **17/17，50 帧，页面错误 0**；中文、confirm/prompt、缩放坐标、1440/390/360 布局、滚动、手机触控、标签、新 DOM 及 namespace/seccomp 沙箱 | [`native-browser.json`](../.runtime/browser-recheck/native-browser.json) |
| 真实模型运行中接管 | **2/2**；取消 active cell 并暂停任务后获 user 控制，同一会话恢复观察人工输入，cell 计数 1、未重放 | [`agent-handoff.json`](../.runtime/browser-recheck/agent-handoff.json) |
| 公网补充边界 | **3/3**；beforeunload 接受/取消、两个客户端共享 owner 与旧代 409、390/360 百度画面稳定布局及目检 | [`public-extra.json`](../.runtime/browser-recheck/public-extra.json) |
| 部署与本地服务 | app/browser 各 **62/62 文件 SHA-256 一致**，差异 0，两容器健康、诊断关闭；本地正式服务已重启，健康/模型配置/登录退出正常，生态目录仍为 94 条 | [`deployment.json`](../.runtime/browser-recheck/deployment.json)、[`local-health.json`](../.runtime/browser-recheck/local-health.json) |

公网检查共 **31 项**，不与本地测试、历史阶段或单独诊断重复累计。最终键盘输入 `personal-agent-123` 为 18 个字符，网页收到 18 次 keydown 和 18 次 keyup；拖动元素的实际 `left=340px`。40 次滚轮最终合并为 1 个请求，`scrollY=800`，交回耗时 **819 ms**；运行中接管耗时 **489 ms**。这些是本轮样本，不表示稳定延迟上限。

真实模型等待脚本最初在准备页面时调用返回 `undefined` 的 `focus()`，测试探针无法 JSON 序列化，模型尚未被调用。已保留 [`model-wait-probe-failure.json`](../.runtime/browser-recheck/model-wait-probe-failure.json)，改为等待输入框存在、显式返回布尔值并核对真实输入后，完整阶段重新运行通过；没有放宽业务断言。

所有测试专属标签和登录都已清理，测试任务保留审计且已停止。部署重建后标签 ID 改变，本轮按部署前保存的地址恢复原三张标签、原选择及 owner；profile 数据保留，这不等于实现跨重启恢复标签历史和完整页面状态。4119/4107 夹具端口均关闭、专属文件和远端临时压缩包删除，回滚镜像保留；见 [`cleanup.json`](../.runtime/browser-recheck/cleanup.json)。

最终模型与 Resend 定向扫描确认两端密钥和配置一致、加密设置未变，明文命中与扫描错误均为 0；扫描未覆盖已删除日志、压缩归档或未知密钥，也没有发送邮件。证据：[`security.json`](../.runtime/full-verification/security.json) 的最新 `final`、[`resend-security.json`](../.runtime/full-verification/resend-security.json)。

## 能力边界

网页验证码、站点风控或服务器网络拦截需要与浏览器控制故障分别判断。pointer down/move/up 和受控网页拖动已经通过本轮验收；提供该协议不等于已解开第三方验证码，也没有验证实际下单、支付或登录授权。

中文输入栏支持发送文字，不能据此宣称真实 iOS 软键盘、完整 IME composition、远程与本地剪贴板完整互通或所有系统快捷键可用。系统文件选择与下载窗口、跨进程 iframe 全面适配、物理网络断网、长期压力仍未验收。报告只链接证据文件，不复制其中的私有网页地址或凭据。
