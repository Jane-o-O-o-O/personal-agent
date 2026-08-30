//! E2E tests for wecom-transport.
//!
//! Each test.rs lives next to its case directory in test-e2e/cases/ and is
//! included here via `include!`. Shared helpers are in test-e2e/helpers/.

mod helpers;
use helpers::*;

// ── http ────────────────────────────────────────────────────

mod http {
    use super::*;

    mod invoke_json {
        use super::*;
        include!("cases/http/001-invoke-json/test.rs");
    }

    mod binary_response {
        use super::*;
        include!("cases/http/002-binary-response/test.rs");
    }

    mod error_handling {
        use super::*;
        include!("cases/http/003-error-handling/test.rs");
    }

    mod headers {
        use super::*;
        include!("cases/http/004-additional-headers/test.rs");
    }

    mod long_task {
        use super::*;
        include!("cases/http/005-long-task/test.rs");
    }

    mod network_error {
        use super::*;
        include!("cases/http/006-network-error/test.rs");
    }

    mod headers_passthrough {
        use super::*;
        include!("cases/http/007-headers-passthrough/test.rs");
    }

    mod raw_mode {
        use super::*;
        include!("cases/http/009-raw-mode/test.rs");
    }
}

// ── builder ─────────────────────────────────────────────────

mod builder {
    use super::*;

    mod build_and_invoke {
        use super::*;
        include!("cases/builder/001-build-and-invoke/test.rs");
    }
}

// ── capture ─────────────────────────────────────────────────

mod capture {
    use super::*;

    mod single_scope {
        use super::*;
        include!("cases/capture/001-single-scope/test.rs");
    }

    mod request_reconstruction {
        use super::*;
        include!("cases/capture/002-request-reconstruction/test.rs");
    }
}
