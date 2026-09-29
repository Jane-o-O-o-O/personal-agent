# 邮件集成（当前版本）

当前只实现通过 Resend 发送**单封、单收件人、纯文本**邮件。发件地址固定为 `i@jane-zz.me`；任务只能提供收件地址、主题和正文，不能更改发件地址，也不支持 HTML、附件、抄送、密送或批量发送。启用前需在 Resend 配置 API Key，并完成 `jane-zz.me` 的发送域名验证。Resend 允许已验证域名下的地址直接作为 From 使用，无需逐个创建发件身份；这不等于该地址已具备收信能力。[Resend 发送说明](https://resend.com/docs/dashboard/emails/introduction)

每封新邮件都由应用发起一次批准，批准内容绑定完整的发件地址、收件地址、主题和纯文本正文。只有用户在应用内批准后才调用 `POST https://api.resend.com/emails`；聊天中的同意文字不能代替批准记录。批准前拒绝或取消不会发信；请求发出后若中断，结果须按未知处理。

发送前，应用先在本地持久化该邮件的操作记录，并以其唯一 ID 设置 Resend 的 `Idempotency-Key`。同一任务中再次执行相同内容时，已确认接受的记录返回原邮件 ID，不再重复发送。请求超时、响应不完整或结果无法确认时，本地状态标记为 `unknown`；进程中断留下的在途记录也标为未知。**未知结果不会自动重试或换一个幂等键重发**；应先在 Resend 核对该邮件，再决定后续处理。Resend 明确返回拒绝时则标为 `failed`，配置纠正后由用户重新批准的新工具调用可以生成新的发送记录。Resend 的幂等键在 24 小时内防止相同请求重复发送，但首次有效请求仍会发信，不能作为预演模式。[Resend 幂等键说明](https://resend.com/docs/dashboard/emails/idempotency-keys)

发信快照在加密设置中保存；逐封审批记录会在应用数据库和已连接的微信审批通知中显示收件人、主题与正文，以便用户核对。邮件内容不应被视为完全不落明文。

工具返回 `accepted` 和 Resend 邮件 ID，只表示 Resend 已接受发信请求，**不表示收件人已收到邮件**。投递结果需要查看 Resend 的邮件事件；`GET /emails/:email_id` 返回的字段是 `last_event`，例如 `sent`、`delivered`、`bounced` 或 `failed`。其中 `delivered` 表示已交给收件方邮件服务器。[发送 API](https://resend.com/docs/api-reference/emails/send-email) · [查询已发邮件 API](https://resend.com/docs/api-reference/emails/retrieve-email) · [事件说明](https://resend.com/docs/dashboard/emails/manage-emails)

连接器的“测试连接”只调用只读 `GET https://api.resend.com/domains`，检查 `jane-zz.me` 是否为 `verified` 且发送能力已启用，**不会发送测试邮件**。只有 Full access API Key 可以读取域名；Sending access Key 可用于发信，但查询域名会返回 `restricted_api_key`，因此测试只能报告“密钥已配置、域名未能只读核验”，不能声称域名已验证或邮件已投递。[域名列表 API](https://resend.com/docs/api-reference/domains/list-domains) · [API Key 权限](https://resend.com/docs/create-an-api-key) · [错误码](https://resend.com/docs/api-reference/errors)

QQ 邮箱和 Gmail 的 IMAP 收信尚未接入。本版本不会登录或读取这两个邮箱；后续接入时，用户需分别提供相应账号的授权与所需权限。Resend 发信配置不自动授予 QQ/Gmail 收信权限。
