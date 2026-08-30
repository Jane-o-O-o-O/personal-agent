# desc.md 速写指南

手写 desc.md 时只需覆盖以下要点，格式不重要，LLM 会根据 DESC_SPEC.md 规范化。

## 必填项

```markdown
# 标题（一句话说明测什么）

- Transport：HTTP / 无

## 前置
（mock 要返回什么、需要什么 env / 文件）

## 命令
wecom xxx yyy --flag value

## 断言
（退出码、stdout 内容、mock 收到什么请求、文件系统发生什么变化）
```

## 写作要点

- **标题**用反引号包 flag：`` `--dry-run` 不发送请求 ``
- **前置**中 mock 可简写：`mock: catalog + service detail + method call`
- **断言**不用分"CLI / HTTP / FS"三节，混着写即可，LLM 会拆分
- 来源编号（A.1、S2）可省略，LLM 会补
- 关键上下文（源码路径）可省略，LLM 会根据代码库补全

## 最简示例

```markdown
# `--version` 输出版本号

- Transport：无

## 命令
wecom --version

## 断言
退出码 0，stdout 含 "wecom"
```

## 中等示例

```markdown
# `--output` 写文件

- Transport：HTTP

## 前置
mock: catalog + service detail + method call 返回 departments JSON

## 命令
wecom hr department list --id root --output <tmp>/out.json

## 断言
- 退出码 0
- stdout 是 DownloadResult JSON（content_type=application/json）
- out.json 被创建，内容是 departments JSON
- 文件权限 0o600
- method call 被调 1 次
```

## 写完后

让 LLM 执行：

> 根据 DESC_SPEC.md 规范化这份 desc.md，补全缺失章节和关键上下文
