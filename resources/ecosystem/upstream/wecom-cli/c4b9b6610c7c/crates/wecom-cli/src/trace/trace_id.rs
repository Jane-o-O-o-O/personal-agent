use base64::Engine;
use base64::engine::general_purpose::STANDARD;

const TRACE_ID_BYTES: usize = 16;

pub fn generate_trace_id() -> String {
    let bytes: [u8; TRACE_ID_BYTES] = rand::random();
    STANDARD.encode(bytes)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn trace_id_has_fixed_shape() {
        let id = generate_trace_id();
        assert_eq!(id.len(), 24);
        assert!(id.ends_with("=="));
    }

    #[test]
    fn trace_id_uses_base64_alphabet() {
        let id = generate_trace_id();
        for ch in id.chars() {
            let ok = ch.is_ascii_alphanumeric() || ch == '+' || ch == '/' || ch == '=';
            assert!(ok, "非法 base64 字符: {ch:?}");
        }
    }

    #[test]
    fn trace_id_decodes_to_16_bytes() {
        let id = generate_trace_id();
        let raw = STANDARD.decode(id).expect("应能标准 base64 解码");
        assert_eq!(raw.len(), TRACE_ID_BYTES);
    }

    #[test]
    fn trace_id_is_unique_across_calls() {
        let mut set = std::collections::HashSet::new();
        for _ in 0..1000 {
            assert!(set.insert(generate_trace_id()), "traceid 出现重复");
        }
    }
}
