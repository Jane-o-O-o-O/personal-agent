#[tokio::test]
async fn cli_run_on_poll_emits_tick_each_round_including_missing_result() {
    use wiremock::matchers::{method, path};
    use wiremock::{Mock, MockServer, ResponseTemplate};

    let server = MockServer::start().await;
    setup_discovery_mocks(&server).await;

    // 首响应：taskid 触发长任务轮询
    Mock::given(method("POST"))
        .and(path("/department/list"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({
            "taskid": "T-RUN",
            "long_task_poll": {"done": false, "task_timeout": 60, "polling_interval_ms": 1}
        })))
        .expect(1)
        .mount(&server)
        .await;

    // 第 1 轮：result 缺失，done=false → on_poll 应触发，event.result=None
    Mock::given(method("POST"))
        .and(path("/task/query"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({
            "long_task_poll": {"done": false, "polling_interval_ms": 1}
        })))
        .up_to_n_times(1)
        .mount(&server)
        .await;

    // 第 2 轮：result 非空，done=false → on_poll 应触发，event.result=Some(parsed Value)
    Mock::given(method("POST"))
        .and(path("/task/query"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({
            "result": "{\"progress\":75}",
            "long_task_poll": {"done": false, "polling_interval_ms": 1}
        })))
        .up_to_n_times(1)
        .mount(&server)
        .await;

    // 第 3 轮：done=true 终态 → on_poll 不触发；终态结果作为 CLI 输出落到 stdout
    Mock::given(method("POST"))
        .and(path("/task/query"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({
            "result": "{\"departments\":[{\"id\":\"1\",\"name\":\"Engineering\"}]}",
            "long_task_poll": {"done": true}
        })))
        .expect(1)
        .mount(&server)
        .await;

    // 收集 (taskid, result) 对，验证字段透传
    type Captured = Vec<(String, Option<Value>)>;
    let events: Arc<Mutex<Captured>> = Arc::new(Mutex::new(Vec::new()));
    let events_cb = events.clone();

    let buf = SharedBuf::new();
    let client = build_test_client(&server.uri());

    let result = client
        .run(hr_dept_list_argv(&[]))
        .output(wecom::CliRunOutput::new(buf.clone()))
        .on_poll(move |ev| {
            events_cb
                .lock()
                .unwrap()
                .push((ev.taskid.to_string(), ev.result.cloned()));
        })
        .await;
    assert_cli_ok(&result, &buf, "cli_run with on_poll");

    // CLI 终态输出（stdout）—— 由 .await 返回值承载，跟 on_poll 无关
    let v = assert_stdout_json(&buf);
    assert_eq!(v["departments"][0]["id"], "1");
    assert_eq!(v["departments"][0]["name"], "Engineering");

    // 心跳事件断言
    let got = events.lock().unwrap().clone();
    assert_eq!(got.len(), 2, "应仅在 2 个非终态轮触发，实际：{got:?}");

    // 第 1 轮：result 缺失，但仍触发心跳
    assert_eq!(got[0].0, "T-RUN", "taskid 应正确透传给事件");
    assert!(
        got[0].1.is_none(),
        "第 1 轮 result 缺失，event.result 应为 None"
    );

    // 第 2 轮：result 已 parse 成 Value::Object，调用方无需再做 serde_json::from_str
    assert_eq!(got[1].0, "T-RUN");
    assert_eq!(got[1].1, Some(json!({"progress": 75})));
}
