mod chain;
mod trace_id;

use base64::Engine;
use base64::engine::general_purpose::STANDARD;

pub const TRACE_HEADER: &str = "x-wecom-trace";

const MAX_CHAIN_LEN: usize = 512;

pub fn build_trace_header_value() -> String {
    let chain = chain::capture_current_capped(MAX_CHAIN_LEN);
    let id = trace_id::generate_trace_id();

    let line = format!("#chain={chain}#id={id}#");
    STANDARD.encode(line)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn header_value_is_valid_base64() {
        let v = build_trace_header_value();
        assert!(STANDARD.decode(&v).is_ok());
    }

    #[test]
    fn header_value_is_ascii_without_ctrl() {
        let v = build_trace_header_value();
        assert!(v.is_ascii());
        assert!(!v.chars().any(|c| c.is_control()));
    }

    #[test]
    fn decoded_line_is_slimmed() {
        let v = build_trace_header_value();
        let raw = STANDARD.decode(&v).expect("base64");
        let line = String::from_utf8(raw).expect("utf8");
        assert!(line.starts_with("#chain="));
        assert!(line.contains("#id="));
        assert!(line.ends_with("#"));
        assert!(!line.contains("#pid="), "不应含 pid: {line}");
        assert!(!line.contains("#cost="), "不应含 cost: {line}");
        assert!(!line.contains("#cmdline="), "不应含 cmdline: {line}");
        assert!(!line.starts_with('['), "不应含时间戳: {line}");
    }

    #[test]
    fn header_length_is_bounded() {
        let v = build_trace_header_value();
        assert!(v.len() <= 800, "header 过大: {} 字符", v.len());
    }
}
