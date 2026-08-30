//! E2E tests for wecom crate.
//!
//! Each test.rs lives next to its case directory in test-e2e/cases/ and is
//! included here via `include!`. Shared helpers are in test-e2e/helpers/.

mod helpers;
use helpers::*;

// ── client ──────────────────────────────────────────────────

mod client {
    use super::*;

    mod build {
        use super::*;
        include!("cases/client/001-build/test.rs");
    }

    mod list_services {
        use super::*;
        include!("cases/client/002-list-services/test.rs");
    }

    mod get_service {
        use super::*;
        include!("cases/client/003-get-service/test.rs");
    }

    mod method_call {
        use super::*;
        include!("cases/client/004-method-call/test.rs");
    }

    mod on_poll_long_task {
        use super::*;
        include!("cases/client/005-on-poll-long-task/test.rs");
    }

    #[allow(unused_imports)]
    mod custom_endpoint {
        use super::*;
        include!("cases/client/006-custom-endpoint/test.rs");
    }

    #[allow(unused_imports)]
    mod set_base_url_discovery {
        use super::*;
        include!("cases/client/007-set-base-url-discovery/test.rs");
    }

    mod default_fallback_sandbox {
        use super::*;
        include!("cases/client/008-default-fallback-sandbox/test.rs");
    }
}

// ── run (argv-driven) ───────────────────────────────────────

mod run {
    use super::*;

    mod method_call {
        use super::*;
        include!("cases/run/001-method-call/test.rs");
    }

    mod help {
        use super::*;
        include!("cases/run/003-help/test.rs");
    }

    mod on_poll_long_task {
        use super::*;
        include!("cases/run/005-on-poll-long-task/test.rs");
    }

    mod typo_top_level_subcommand {
        use super::*;
        include!("cases/run/007-typo-top-level-subcommand/test.rs");
    }

    mod no_service_fallback {
        use super::*;
        include!("cases/run/015-no-service-fallback/test.rs");
    }

    mod on_extra_data {
        use super::*;
        include!("cases/run/008-on-extra-data/test.rs");
    }

    mod on_extra_data_empty {
        use super::*;
        include!("cases/run/010-on-extra-data-empty/test.rs");
    }

    mod on_extra_data_pagination {
        use super::*;
        include!("cases/run/011-on-extra-data-pagination/test.rs");
    }

    mod path_alias {
        use super::*;
        include!("cases/run/012-path-alias/test.rs");
    }

    mod json_extras_pagination {
        use super::*;
        include!("cases/run/016-json-extras-pagination/test.rs");
    }

    mod json_extras_conflict {
        use super::*;
        include!("cases/run/017-json-extras-conflict/test.rs");
    }

    mod json_extras_dry_run {
        use super::*;
        include!("cases/run/018-json-extras-dry-run/test.rs");
    }

    mod service_doc {
        use super::*;
        include!("cases/run/019-service-doc/test.rs");
    }

    mod method_doc {
        use super::*;
        include!("cases/run/020-method-doc/test.rs");
    }

    mod no_args {
        use super::*;
        include!("cases/run/021-no-args/test.rs");
    }

    mod set_basic {
        use super::*;
        include!("cases/run/022-set-basic/test.rs");
    }

    mod set_dry_run {
        use super::*;
        include!("cases/run/023-set-dry-run/test.rs");
    }

    mod custom_command {
        use super::*;
        include!("cases/run/024-custom-command/test.rs");
    }

    mod custom_command_shadow_service {
        use super::*;
        include!("cases/run/025-custom-command-shadow-service/test.rs");
    }

    mod custom_command_error {
        use super::*;
        include!("cases/run/026-custom-command-error/test.rs");
    }

    mod custom_command_subcommand_help {
        use super::*;
        include!("cases/run/027-custom-command-subcommand-help/test.rs");
    }

    mod error_code_shows_help {
        use super::*;
        include!("cases/run/028-error-code-shows-help/test.rs");
    }

    mod remote_doc {
        use super::*;
        include!("cases/run/029-remote-doc/test.rs");
    }

    mod service_alias {
        use super::*;
        include!("cases/run/032-service-alias/test.rs");
    }
}

// ── headers ─────────────────────────────────────────────────

mod headers {
    use super::*;

    mod passthrough {
        use super::*;
        include!("cases/headers/001-passthrough/test.rs");
    }
}

// ── error ───────────────────────────────────────────────────

mod error {
    use super::*;

    mod network_error {
        use super::*;
        include!("cases/error/001-network-error/test.rs");
    }

    mod invalid_json_body {
        use super::*;
        include!("cases/error/002-invalid-json-body/test.rs");
    }

    mod json_repair {
        use super::*;
        include!("cases/error/003-json-repair/test.rs");
    }

    mod unescaped_quotes_dry_run {
        use super::*;
        include!("cases/error/004-unescaped-quotes-dry-run/test.rs");
    }
}

// ── pagination ──────────────────────────────────────────────

mod pagination {
    use super::*;

    mod page_all {
        use super::*;
        include!("cases/pagination/001-page-all/test.rs");
    }

    mod page_count_exceeds {
        use super::*;
        include!("cases/pagination/002-page-count-exceeds/test.rs");
    }

    mod page_count_capped {
        use super::*;
        include!("cases/pagination/003-page-count-capped/test.rs");
    }

    mod page_with_headers {
        use super::*;
        include!("cases/pagination/004-page-with-headers/test.rs");
    }
}

// ── schema ──────────────────────────────────────────────────

mod schema {
    use super::*;

    mod list {
        use super::*;
        include!("cases/schema/001-list/test.rs");
    }

    mod get {
        use super::*;
        include!("cases/schema/002-get/test.rs");
    }

    mod service_schema_flag {
        use super::*;
        include!("cases/schema/003-service-schema-flag/test.rs");
    }
}

// ── cache ───────────────────────────────────────────────────

mod cache {
    use super::*;

    mod status {
        use super::*;
        include!("cases/cache/001-status/test.rs");
    }

    mod clear {
        use super::*;
        include!("cases/cache/002-clear/test.rs");
    }
}

// ── directive ───────────────────────────────────────────────

mod directive {
    use super::*;

    mod file_save {
        use super::*;
        include!("cases/directive/001-file-save/test.rs");
    }

    mod media_upload {
        use super::*;
        include!("cases/directive/002-media-upload/test.rs");
    }

    mod octet_stream {
        use super::*;
        include!("cases/directive/003-octet-stream/test.rs");
    }

    mod file_save_malicious_name {
        use super::*;
        include!("cases/directive/004-file-save-malicious-name/test.rs");
    }
}

// ── output ──────────────────────────────────────────────────

mod output {
    use super::*;

    mod file {
        use super::*;
        include!("cases/output/001-file/test.rs");
    }

    mod output_dir_non_download {
        use super::*;
        include!("cases/output/002-output-dir-non-download/test.rs");
    }

    mod binary {
        use super::*;
        include!("cases/output/003-binary/test.rs");
    }

    mod default_cwd {
        use super::*;
        include!("cases/output/004-default-cwd/test.rs");
    }

    mod output_dir_shapes {
        use super::*;
        include!("cases/output/005-output-dir-shapes/test.rs");
    }

    mod dry_run_output_dir_gate {
        use super::*;
        include!("cases/output/006-dry-run-output-dir-gate/test.rs");
    }
}
