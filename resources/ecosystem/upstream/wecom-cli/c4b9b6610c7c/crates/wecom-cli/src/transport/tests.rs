//! transport 模块测试。

use assert_json_diff::assert_json_eq;
use serde_json::json;
use wiremock::matchers::{method, path};
use wiremock::{Match, Mock, MockServer, Request, ResponseTemplate};

use wecom_transport::{HttpTransportBackend, ResponseEnvelope, Transport};

use super::backend::tests::new_with_material;
use super::capability::{RequireAuth, SuppressAuth};
use super::envelope::{FlatRes, NestedRes};
use super::*;
use crate::auth;
use crate::error::Error as CliError;

/// 测试用鉴权引导端点（固定值，避免依赖 env/config）。
const TEST_AUTH_ENDPOINT: &str = "https://qyapi.weixin.qq.com/cgi-bin/aibot/cli/get_cli_config";

/// 匹配器：请求不含 Authorization 头。
struct NoAuthorization;
impl Match for NoAuthorization {
    fn matches(&self, request: &Request) -> bool {
        request.headers.get("authorization").is_none()
    }
}

/// 构造装饰了 [WecomBackend] 的 Transport（内层为真实 HttpTransportBackend）。
fn wrapped_transport(
    base_url: &str,
    bot: Option<auth::Bot>,
    token: Option<&str>,
    auth_endpoint: &str,
) -> Transport {
    HttpTransportBackend::builder()
        .base_url(base_url)
        .build()
        .expect("valid")
        .wrap_backend(|backend| Arc::new(new_with_material(backend, bot, token, auth_endpoint)))
}

/// 构造带 base_url / envelope 的 HTTP endpoint（鉴权能力由各用例自行挂载）。
fn ep(base: &str, path: &str) -> wecom_transport::Endpoint {
    wecom_transport::Endpoint::new()
        .with(wecom_transport::HttpEndpoint::new(path).with_service(base))
}

/// P1：[WecomBackend] 经 wrap_backend 装饰后 name 委托内层
/// 条件：对 HttpTransportBackend 调用 wrap_backend 包上 WecomBackend
/// 断言：transport.name() == "http"
#[test]
fn wrap_backend_decorates_in_place() {
    let transport = HttpTransportBackend::builder()
        .base_url("http://localhost")
        .build()
        .expect("valid");
    let transport = transport.wrap_backend(|backend| {
        Arc::new(new_with_material(
            backend,
            Some(auth::Bot::new("bot1".into(), "secret1".into())),
            Some("tok-1"),
            TEST_AUTH_ENDPOINT,
        ))
    });
    assert_eq!(transport.name(), "http");
}

/// P1：[WecomBackend::Debug] 不泄露 bot secret 与缓存 token
/// 条件：构造含 "super-secret" / "cached-token" 的 WecomBackend 并格式化
/// 断言：Debug 输出不含这两个敏感值
#[test]
fn debug_does_not_leak_secrets() {
    let backend = new_with_material(
        Arc::new(HttpTransportBackend::default()),
        Some(auth::Bot::new("bot1".into(), "super-secret".into())),
        Some("cached-token"),
        TEST_AUTH_ENDPOINT,
    );
    let dbg = format!("{backend:?}");
    assert!(!dbg.contains("super-secret"), "secret 泄露: {dbg}");
    assert!(!dbg.contains("cached-token"), "token 泄露: {dbg}");
}

// ── 动态 Authorization 注入 ───────────────────────────────

/// P0：[WecomBackend] 挂 RequireAuth + 有 token → 调用时注入 Authorization 头
/// 条件：endpoint 挂 RequireAuth，token=tok-x；mock 要求 authorization: Bearer tok-x
/// 断言：invoke 成功，into_result()=={"ok":true}，mock 命中
#[tokio::test]
async fn injects_auth_when_require_auth_and_token_available() {
    let server = MockServer::start().await;
    Mock::given(method("POST"))
        .and(path("/auth"))
        .and(wiremock::matchers::header("authorization", "Bearer tok-x"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({"result": "{\"ok\":true}"})))
        .expect(1)
        .mount(&server)
        .await;

    let transport = wrapped_transport(&server.uri(), None, Some("tok-x"), TEST_AUTH_ENDPOINT);
    let endpoint = ep(&server.uri(), "/auth").with(RequireAuth);
    let v = transport
        .invoke(&endpoint, json!({}))
        .await
        .unwrap()
        .into_result()
        .unwrap();
    assert_json_eq!(v, json!({"ok": true}));
    server.verify().await;
}

/// P0：[WecomBackend] 挂 RequireAuth + 无 token → Err(Error::Auth)，请求不发出
/// 条件：endpoint 挂 RequireAuth，无 token；mock expect(0)
/// 断言：invoke 返回 Err(Wrapped(OtherError(CliError::Auth)))，mock 未被调用
#[cfg(not(feature = "skip-auth-check"))]
#[tokio::test]
async fn rejects_require_auth_without_token() {
    let server = MockServer::start().await;
    Mock::given(method("POST"))
        .and(path("/auth"))
        .respond_with(ResponseTemplate::new(200))
        .expect(0)
        .mount(&server)
        .await;

    let transport = wrapped_transport(&server.uri(), None, None, TEST_AUTH_ENDPOINT);
    let endpoint = ep(&server.uri(), "/auth").with(RequireAuth);
    let err = transport.invoke(&endpoint, json!({})).await.unwrap_err();
    match err {
        wecom_transport::Error::Wrapped(w) => {
            let inner = w
                .as_any()
                .downcast_ref::<wecom_error::OtherError>()
                .and_then(|o| o.0.downcast_ref::<CliError>());
            assert!(
                inner.is_some_and(|e| matches!(e, CliError::Auth(_))),
                "expected CliError::Auth, got {inner:?}"
            );
        }
        other => panic!("expected Wrapped(CliError::Auth), got {other:?}"),
    }
    server.verify().await;
}

/// P0：[WecomBackend] skip-auth-check 下挂 RequireAuth + 无 token → 跳过门禁，
/// 请求不注入 Authorization 照常发出（由后台鉴权错误兜底）
/// 条件：endpoint 挂 RequireAuth，无 token；mock expect(1)
/// 断言：invoke 成功返回，mock 被调用一次
#[cfg(feature = "skip-auth-check")]
#[tokio::test]
async fn skips_require_auth_gate_without_token() {
    let server = MockServer::start().await;
    Mock::given(method("POST"))
        .and(path("/auth"))
        .and(NoAuthorization)
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({"result": "{\"ok\":true}"})))
        .expect(1)
        .mount(&server)
        .await;

    let transport = wrapped_transport(&server.uri(), None, None, TEST_AUTH_ENDPOINT);
    let endpoint = ep(&server.uri(), "/auth").with(RequireAuth);
    let v = transport
        .invoke(&endpoint, json!({}))
        .await
        .unwrap()
        .into_result()
        .unwrap();
    assert_json_eq!(v, json!({"ok": true}));
    server.verify().await;
}

/// P0：[WecomBackend] 未挂 RequireAuth 能力 + 有 token → 仍注入 Authorization 头
/// 条件：endpoint 不挂 RequireAuth（如 ServiceDiscovery），token=tok-x；
///       mock 要求 authorization: Bearer tok-x
/// 断言：invoke 成功，into_result()=={"ok":true}，mock 命中（证明注入）
#[tokio::test]
async fn injects_auth_on_endpoint_without_require_auth() {
    let server = MockServer::start().await;
    Mock::given(method("POST"))
        .and(path("/open"))
        .and(wiremock::matchers::header("authorization", "Bearer tok-x"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({"result": "{\"ok\":true}"})))
        .expect(1)
        .mount(&server)
        .await;

    let transport = wrapped_transport(&server.uri(), None, Some("tok-x"), TEST_AUTH_ENDPOINT);
    let endpoint = ep(&server.uri(), "/open");
    let v = transport
        .invoke(&endpoint, json!({}))
        .await
        .unwrap()
        .into_result()
        .unwrap();
    assert_json_eq!(v, json!({"ok": true}));
    server.verify().await;
}

/// P0：[WecomBackend] 无 token + 未挂 RequireAuth 门禁（如未登录时的 ServiceDiscovery）
/// → 不注入 Authorization 头，请求正常发出
/// 条件：endpoint 不挂 RequireAuth，无 token；mock 要求无 Authorization 头
/// 断言：invoke 成功，into_result()=={"ok":true}，mock 命中
#[tokio::test]
async fn no_token_no_require_auth_omits_auth_header() {
    let server = MockServer::start().await;
    Mock::given(method("POST"))
        .and(path("/open"))
        .and(NoAuthorization)
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({"result": "{\"ok\":true}"})))
        .expect(1)
        .mount(&server)
        .await;

    let transport = wrapped_transport(&server.uri(), None, None, TEST_AUTH_ENDPOINT);
    let endpoint = ep(&server.uri(), "/open");
    let v = transport
        .invoke(&endpoint, json!({}))
        .await
        .unwrap()
        .into_result()
        .unwrap();
    assert_json_eq!(v, json!({"ok": true}));
    server.verify().await;
}

// ── NestedRes（网关扁平协议，由产品层定义）──────────────────

/// P0：[NestedRes] 扁平协议：errcode 校验 → results_json 脱壳
/// 条件：body 为 {errcode:0, results_json: "{result:...}"}
/// 断言：decode 返回 ApiResponse，result 为脱壳后的字符串
#[test]
fn results_json_res_decodes_flat_protocol() {
    let body = json!({
        "errcode": 0,
        "errmsg": "ok",
        "results_json": r#"{"result":"{\"ok\":true}"}"#,
    });
    let res = NestedRes
        .decode("https://api.example.com/x", body)
        .expect("flat protocol should decode");
    assert_eq!(res.result.as_deref(), Some(r#"{"ok":true}"#));
}

/// P0：[NestedRes] 扁平协议：errcode != 0 → Api 错误
/// 条件：body 为 {errcode: 40001, errmsg: "bad request"}
/// 断言：decode 返回 Err(Error::Api)，code=40001，message 为 errmsg
#[test]
fn results_json_res_err_code_is_api_error() {
    let body = json!({
        "errcode": 40001,
        "errmsg": "invalid credential",
        "results_json": r#"{"result":"{}"}"#,
    });
    let err = NestedRes
        .decode("https://api.example.com/x", body)
        .expect_err("errcode != 0 should be an error");
    match err {
        wecom_transport::Error::Api { code, message, .. } => {
            assert_eq!(code, Some(40001));
            assert_eq!(message, "invalid credential");
        }
        other => panic!("expected Error::Api, got {other:?}"),
    }
}

/// P1：[NestedRes] 扁平协议：缺少 results_json → 协议异常
/// 条件：body 仅含 errcode/errmsg
/// 断言：decode 返回 Err(Error::Parse)，message 含 missing `results_json`
#[test]
fn results_json_res_missing_results_json_is_parse_error() {
    let body = json!({ "errcode": 0, "errmsg": "ok" });
    let err = NestedRes
        .decode("https://api.example.com/x", body)
        .expect_err("missing results_json should be an error");
    assert!(
        matches!(err, wecom_transport::Error::Parse { .. }),
        "expected Error::Parse, got {err:?}"
    );
}

/// P1：[NestedRes] 扁平协议：results_json 内层 error.code 校验透传
/// 条件：results_json 内层为 {error:{code:40001}}
/// 断言：decode 返回 Err(Error::Api)，code=40001
#[test]
fn results_json_res_inner_api_error_is_validated() {
    let body = json!({
        "errcode": 0,
        "errmsg": "ok",
        "results_json": r#"{"result":null,"error":{"code":40001,"message":"inner err"}}"#,
    });
    let err = NestedRes
        .decode("https://api.example.com/x", body)
        .expect_err("inner error.code should be an error");
    match err {
        wecom_transport::Error::Api { code, .. } => assert_eq!(code, Some(40001)),
        other => panic!("expected Error::Api, got {other:?}"),
    }
}

// ── FlatRes（扁平响应）───────────────────────────────

/// P0：[WecomBackend] FlatRes 引导端点挂 SuppressAuth → 即使有 token 也不注入 Authorization
/// 条件：endpoint 配 FlatRes envelope + SuppressAuth，有旧 token；
///       mock 返回 {errcode:0, token:"t1"} 且要求无 Authorization
/// 断言：into_result() == {"token":"t1"}；mock 命中（未注入 token）
#[tokio::test]
async fn flat_envelope_bootstrap_suppresses_auth() {
    let server = MockServer::start().await;
    Mock::given(method("POST"))
        .and(path("/bootstrap"))
        .and(NoAuthorization)
        .respond_with(
            ResponseTemplate::new(200).set_body_json(json!({"errcode": 0, "token": "t1"})),
        )
        .expect(1)
        .mount(&server)
        .await;

    let transport = wrapped_transport(&server.uri(), None, Some("old-token"), TEST_AUTH_ENDPOINT);
    let endpoint = wecom_transport::Endpoint::new().with(
        wecom_transport::HttpEndpoint::new("/bootstrap")
            .with_service(server.uri())
            .with_res_envelope(FlatRes),
    );
    let endpoint = endpoint.with(SuppressAuth);
    let v = transport
        .invoke(&endpoint, json!({}))
        .await
        .unwrap()
        .into_result()
        .unwrap();
    assert_json_eq!(v, json!({"token": "t1"}));
    server.verify().await;
}

// ── 853004 静默刷新（options 来自 execute）─────────────────

/// P0：[WecomBackend] 853004 刷新复用触发请求的 options（自定义 header），
/// 引导请求剥离失效的旧 Authorization 头，随后以新 token 重放原请求。
/// 条件：业务请求带 x-run-scope + 旧 token → mock 返回 853004；
///       引导端点断言带 x-run-scope 且无 Authorization → 返回新 token；
///       重试断言带新 token + x-run-scope → 成功
/// 断言：最终 into_result()=={"ok":true}，三个 mock 均命中
#[tokio::test]
async fn refresh_reuses_execute_options_without_stale_auth() {
    // 隔离凭据目录：避免命中本机真实 credentials.enc 使双检直接复用磁盘 token。
    // 使用进程级共享锁，与 auth::credentials 等修改 WECOM_CLI_CONFIG_DIR 的测试互斥。
    let _guard = crate::env::TEST_ENV_LOCK.lock().await;
    let dir = tempfile::tempdir().unwrap();
    unsafe {
        std::env::set_var(crate::env::CONFIG_DIR, dir.path());
    }
    async {
        let server = MockServer::start().await;
        let auth_url = format!("{}/bootstrap", server.uri());

        // 1. 原请求：旧 token + 自定义 header → 853004
        Mock::given(method("POST"))
            .and(path("/api"))
            .and(wiremock::matchers::header(
                "authorization",
                "Bearer tok-old",
            ))
            .and(wiremock::matchers::header("x-run-scope", "run-1"))
            .respond_with(ResponseTemplate::new(200).set_body_json(json!({
                "error": {"code": 853004, "message": "token expired"}
            })))
            .expect(1)
            .mount(&server)
            .await;

        // 2. 引导请求：复用自定义 header，但不带失效的旧 Authorization
        Mock::given(method("POST"))
            .and(path("/bootstrap"))
            .and(wiremock::matchers::header("x-run-scope", "run-1"))
            .and(NoAuthorization)
            .respond_with(
                ResponseTemplate::new(200).set_body_json(json!({"errcode": 0, "token": "tok-new"})),
            )
            .expect(1)
            .mount(&server)
            .await;

        // 3. 重放：新 token + 自定义 header → 成功
        Mock::given(method("POST"))
            .and(path("/api"))
            .and(wiremock::matchers::header(
                "authorization",
                "Bearer tok-new",
            ))
            .and(wiremock::matchers::header("x-run-scope", "run-1"))
            .respond_with(
                ResponseTemplate::new(200).set_body_json(json!({"result": "{\"ok\":true}"})),
            )
            .expect(1)
            .mount(&server)
            .await;

        let transport = wrapped_transport(
            &server.uri(),
            Some(auth::Bot::new("bot1".into(), "secret1".into())),
            Some("tok-old"),
            &auth_url,
        );
        let endpoint = ep(&server.uri(), "/api").with(RequireAuth);

        let v = transport
            .invoke(&endpoint, json!({}))
            .header("x-run-scope", "run-1")
            .await
            .unwrap()
            .into_result()
            .unwrap();
        assert_json_eq!(v, json!({"ok": true}));
        server.verify().await;
    }
    .await;
    unsafe {
        std::env::remove_var(crate::env::CONFIG_DIR);
    }
}

/// P0：[WecomBackend] 引导端点自身返回 853004 时不得重入刷新（自死锁回归）
/// 条件：业务请求（携带 token）返回 853004；引导端点也返回 853004（FlatRes
///       信封将其转为 Error::Api{853004}）
/// 断言：调用在超时内返回原错误（不得挂起）；引导端点仅命中一次
#[tokio::test]
async fn bootstrap_853004_does_not_reenter_refresh() {
    // 隔离凭据目录：避免命中本机真实 credentials.enc 干扰刷新路径。
    let _guard = crate::env::TEST_ENV_LOCK.lock().await;
    let dir = tempfile::tempdir().unwrap();
    unsafe {
        std::env::set_var(crate::env::CONFIG_DIR, dir.path());
    }
    async {
        let server = MockServer::start().await;
        let auth_url = format!("{}/bootstrap", server.uri());

        // 1. 业务请求：旧 token → 853004
        Mock::given(method("POST"))
            .and(path("/api"))
            .respond_with(ResponseTemplate::new(200).set_body_json(json!({
                "error": {"code": 853004, "message": "token expired"}
            })))
            .expect(1)
            .mount(&server)
            .await;

        // 2. 引导端点同样返回 853004：挂 SuppressAuth（不携带 token），
        //    不得再次触发刷新（否则在 refresh_lock 上自死锁）。
        Mock::given(method("POST"))
            .and(path("/bootstrap"))
            .respond_with(ResponseTemplate::new(200).set_body_json(json!({
                "errcode": 853004, "errmsg": "token expired"
            })))
            .expect(1)
            .mount(&server)
            .await;

        let transport = wrapped_transport(
            &server.uri(),
            Some(auth::Bot::new("bot1".into(), "secret1".into())),
            Some("tok-old"),
            &auth_url,
        );
        let endpoint = ep(&server.uri(), "/api").with(RequireAuth);

        // 超时兜底：若重入刷新自死锁，invoke 将永不返回。
        let err = tokio::time::timeout(
            std::time::Duration::from_secs(5),
            transport.invoke(&endpoint, json!({})),
        )
        .await
        .expect("must not deadlock on bootstrap 853004")
        .unwrap_err();
        assert!(
            matches!(
                err,
                wecom_transport::Error::Api {
                    code: Some(853004),
                    ..
                }
            ),
            "expected the original 853004 error, got {err:?}"
        );
        server.verify().await;
    }
    .await;
    unsafe {
        std::env::remove_var(crate::env::CONFIG_DIR);
    }
}

/// P0：[WecomBackend] env 来源 token 命中 853004 → 返回 Error::Auth 提示更新
/// WECOM_CLI_ACCESS_TOKEN，不发起鉴权引导换取
/// 条件：AuthSession 持 Env 变体；业务端点返回 853004；引导端点 expect(0)
/// 断言：错误为 Other(CliError::Auth) 且文案含 WECOM_CLI_ACCESS_TOKEN
#[tokio::test]
async fn env_token_expired_returns_auth_hint_without_bootstrap() {
    let server = MockServer::start().await;
    let auth_url = format!("{}/bootstrap", server.uri());

    Mock::given(method("POST"))
        .and(path("/api"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({
            "error": {"code": 853004, "message": "token expired"}
        })))
        .expect(1)
        .mount(&server)
        .await;
    Mock::given(method("POST"))
        .and(path("/bootstrap"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({"errcode": 0, "token": "t"})))
        .expect(0)
        .mount(&server)
        .await;

    let session = Arc::new(auth::AuthSession::new(
        Some(auth::ResolvedAuthorization::Env {
            token: "env-tok".into(),
        }),
        auth::auth_endpoint(&auth_url),
    ));
    let transport = HttpTransportBackend::builder()
        .base_url(server.uri())
        .build()
        .expect("valid")
        .wrap_backend(|backend| Arc::new(WecomBackend::new(backend, session)));
    let endpoint = ep(&server.uri(), "/api").with(RequireAuth);

    let err = transport.invoke(&endpoint, json!({})).await.unwrap_err();
    match err {
        wecom_transport::Error::Wrapped(w) => {
            let inner = w
                .as_any()
                .downcast_ref::<wecom_error::OtherError>()
                .and_then(|o| o.0.downcast_ref::<CliError>());
            assert!(
                inner.is_some_and(
                    |e| matches!(e, CliError::Auth(msg) if msg.contains(crate::env::ACCESS_TOKEN))
                ),
                "expected CliError::Auth mentioning WECOM_CLI_ACCESS_TOKEN, got {inner:?}"
            );
        }
        other => panic!("expected Wrapped(CliError::Auth), got {other:?}"),
    }
    server.verify().await;
}

/// P0：[WecomBackend] 文件来源但无 bot 凭据命中 853004 → 不参与刷新，回传原始 853004
/// 条件：AuthSession 持 Credentials{ bot: None, token: Some }；业务端点返回 853004；
///       引导端点 expect(0)
/// 断言：错误为 Error::Api{ code: 853004 }（原始业务错误）
#[tokio::test]
async fn missing_bot_credentials_returns_original_853004() {
    // 隔离凭据目录：避免命中本机真实 credentials.enc 干扰刷新双检。
    let _guard = crate::env::TEST_ENV_LOCK.lock().await;
    let dir = tempfile::tempdir().unwrap();
    unsafe {
        std::env::set_var(crate::env::CONFIG_DIR, dir.path());
    }
    async {
        let server = MockServer::start().await;
        let auth_url = format!("{}/bootstrap", server.uri());

        Mock::given(method("POST"))
            .and(path("/api"))
            .respond_with(ResponseTemplate::new(200).set_body_json(json!({
                "error": {"code": 853004, "message": "token expired"}
            })))
            .expect(1)
            .mount(&server)
            .await;
        Mock::given(method("POST"))
            .and(path("/bootstrap"))
            .respond_with(
                ResponseTemplate::new(200).set_body_json(json!({"errcode": 0, "token": "t"})),
            )
            .expect(0)
            .mount(&server)
            .await;

        let transport = wrapped_transport(&server.uri(), None, Some("tok-old"), &auth_url);
        let endpoint = ep(&server.uri(), "/api").with(RequireAuth);
        let err = transport.invoke(&endpoint, json!({})).await.unwrap_err();
        assert!(
            matches!(
                err,
                wecom_transport::Error::Api {
                    code: Some(853004),
                    ..
                }
            ),
            "expected the original 853004 error, got {err:?}"
        );
        server.verify().await;
    }
    .await;
    unsafe {
        std::env::remove_var(crate::env::CONFIG_DIR);
    }
}

// ── token/bot 同源对齐 ────────────────────────────────────────
// 授权材料的同源解析（env 覆盖 / 文件同源 / bot-only 保留）已由
// `auth::resolve::resolve_authorization` 的单元测试覆盖（见 auth/resolve.rs），
// 会话层 refreshable/token 缓存见 auth/session.rs，此处不再重复。
