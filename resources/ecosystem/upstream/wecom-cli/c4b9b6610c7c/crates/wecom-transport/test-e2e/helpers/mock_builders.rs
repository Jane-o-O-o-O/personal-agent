use serde_json::{Value, json};

/// Build a standard HTTP API response body:
/// `{ "result": "<json-string>", "error": null }`
pub fn http_api_response(data: &Value) -> Value {
    json!({
        "result": serde_json::to_string(data).unwrap(),
        "error": null,
    })
}

/// Build a standard HTTP API error response body:
/// `{ "result": null, "error": { "code": <code>, "message": "<msg>" } }`
pub fn http_api_error_response(code: i64, message: &str) -> Value {
    json!({
        "result": null,
        "error": { "code": code, "message": message },
    })
}

/// Build a HTTP long-task initial response with taskid.
pub fn http_long_task_initial_response(taskid: &str, polling_interval_ms: u64) -> Value {
    json!({
        "result": null,
        "taskid": taskid,
        "long_task_poll": {
            "done": false,
            "task_timeout": 60,
            "polling_interval_ms": polling_interval_ms,
        }
    })
}

/// Build a HTTP long-task poll response (done).
pub fn http_long_task_poll_done(result: &Value) -> Value {
    json!({
        "result": serde_json::to_string(result).unwrap(),
        "long_task_poll": { "done": true }
    })
}
