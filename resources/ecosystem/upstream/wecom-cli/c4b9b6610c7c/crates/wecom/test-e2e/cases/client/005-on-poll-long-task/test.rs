#[tokio::test]
async fn long_task_emits_tick_each_round_including_missing_result() {
    use wiremock::matchers::{method, path};
    use wiremock::{Mock, MockServer, ResponseTemplate};

    let server = MockServer::start().await;
    setup_discovery_mocks(&server).await;

    // 首响应：返回 taskid，触发长任务轮询
    Mock::given(method("POST"))
        .and(path("/department/list"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({
            "taskid": "T-LP",
            "long_task_poll": {"done": false, "task_timeout": 60, "polling_interval_ms": 1}
        })))
        .expect(1)
        .mount(&server)
        .await;

    // 第 1 轮：result 缺失（done=false） → on_poll 触发，event.result=None
    Mock::given(method("POST"))
        .and(path("/task/query"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({
            "long_task_poll": {"done": false, "polling_interval_ms": 1}
        })))
        .up_to_n_times(1)
        .mount(&server)
        .await;

    // 第 2 轮：result 非空（done=false） → on_poll 触发，event.result 解析为 Value
    Mock::given(method("POST"))
        .and(path("/task/query"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({
            "result": "{\"progress\":50}",
            "long_task_poll": {"done": false, "polling_interval_ms": 1}
        })))
        .up_to_n_times(1)
        .mount(&server)
        .await;

    // 第 3 轮：done=true 终态 → on_poll 不触发；终态由 .await 返回值承载
    Mock::given(method("POST"))
        .and(path("/task/query"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({
            "result": "{\"departments\":[{\"id\":\"42\"}]}",
            "long_task_poll": {"done": true}
        })))
        .expect(1)
        .mount(&server)
        .await;

    let events: Arc<Mutex<Vec<Option<Value>>>> = Arc::new(Mutex::new(Vec::new()));
    let events_cb = events.clone();

    let client = build_test_client(&server.uri());
    let result = client
        .invoke(&["hr", "department", "list"], json!({"id": "root"}))
        .on_poll(move |ev| {
            events_cb.lock().unwrap().push(ev.result.cloned());
        })
        .await
        .expect("invoke succeeds");

    // 终态返回值
    assert_eq!(result["departments"][0]["id"], "42");

    // 心跳事件
    let got = events.lock().unwrap().clone();
    assert_eq!(got.len(), 2, "应仅在 2 个非终态轮触发，实际：{got:?}");
    assert!(
        got[0].is_none(),
        "第 1 轮 result 缺失，event.result 应为 None"
    );
    assert_eq!(
        got[1],
        Some(json!({"progress": 50})),
        "第 2 轮 event.result 应为已解析的 Value::Object，无需调用方再 parse"
    );
}
