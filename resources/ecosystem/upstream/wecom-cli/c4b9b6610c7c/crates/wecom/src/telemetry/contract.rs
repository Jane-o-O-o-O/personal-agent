//! Wire contract for wecom telemetry events.

/// Wire contract for unified wecom business telemetry events.
///
/// All business events share a single `tracing` target. The event type is
/// identified by the `kind` field and its business data is carried as a JSON
/// `payload` string. Adding a new event kind is purely additive.
pub mod event {
    /// `tracing` target for all wecom business telemetry events.
    pub const TARGET: &str = "wecom::telemetry::event";

    /// Event type name (e.g. `"method_alias"`, `"unknown_directive"`).
    pub const FIELD_KIND: &str = "kind";

    /// JSON string payload carrying the event's business data.
    pub const FIELD_PAYLOAD: &str = "payload";
}

/// Wire contract for the `method_alias` telemetry event.
///
/// Single emission point: [`crate::service::ServiceHandle::method`]. Emitted
/// when resolving a method path rewrote the caller's input at either alias
/// layer — the service-name alias (`ServiceInfo::alias`) or a method-path
/// alias (`MethodSchema::path_alias`). At most one event per method
/// resolution: `input` is the command path as originally typed (service
/// alias preserved), `resolved` is the fully canonical path, so a call
/// rewritten at both layers is still one `input` → `resolved` pair
/// (e.g. `"human-resources search"` → `"hr users search"`).
///
/// Not emitted for: exact-name + real-path resolution, and entry points
/// that never resolve a method (bare service help / `--doc` / `--schema` /
/// `+helper`).
///
/// Payload fields:
///
/// | Field       | Type   | Description                          |
/// |-------------|--------|--------------------------------------|
/// | `input`     | string | Original command path joined by ` `  |
/// | `resolved`  | string | Resolved command path joined by ` `  |
pub mod method_alias {
    /// Event kind name.
    pub const KIND: &str = "method_alias";

    /// Payload field: original command path.
    pub const FIELD_INPUT: &str = "input";

    /// Payload field: resolved command path.
    pub const FIELD_RESOLVED: &str = "resolved";
}

/// Wire contract for the `unknown_directive` telemetry event.
///
/// Emitted when unknown `x-wecom-*` directives are encountered during schema
/// collection. A single event carries all unique unknown directive names
/// found in one pass.
///
/// Payload fields:
///
/// | Field         | Type     | Description                              |
/// |---------------|----------|------------------------------------------|
/// | `directives`  | string[] | Unique unknown `x-wecom-*` directive names |
pub mod unknown_directive {
    /// Event kind name.
    pub const KIND: &str = "unknown_directive";

    /// Payload field: array of unknown directive names.
    pub const FIELD_DIRECTIVES: &str = "directives";
}

/// Wire contract for the `json_repair` telemetry event.
///
/// Emitted by `repair_json` to track JSON repair success rates.
/// Two outcomes are distinguished by the `outcome` payload field:
///
/// | `outcome`        | Meaning                                      |
/// |------------------|----------------------------------------------|
/// | `"ok_repaired"`  | Input was repaired (see `strategy`)           |
/// | `"err_repair"`   | Repair attempted but failed                  |
///
/// Payload fields:
///
/// | Field          | On        | Description                                  |
/// |----------------|-----------|----------------------------------------------|
/// | `outcome`      | both      | See the table above                          |
/// | `strategy`     | ok only   | Repair candidate that won the unified scoring |
/// | `candidates`   | ok only   | Strict-valid candidates entering scoring (`>= 2` means genuine ambiguity arbitration happened) |
///
/// The raw input / repaired output are **never** reported: `--json` bodies
/// carry user content (chat ids, message text).
///
/// Valid JSON that parses without repair does NOT emit any event.
pub mod json_repair {
    /// Event kind name for JSON repair outcome tracking.
    pub const KIND: &str = "json_repair";

    /// Payload field carrying the repair outcome.
    pub const FIELD_OUTCOME: &str = "outcome";

    /// Payload field carrying which repair strategy produced the output.
    ///
    /// `jsonrepair` for the jsonrepair-rs candidate, `unescaped_quotes`
    /// for the quote-repair fork candidate.
    pub const FIELD_STRATEGY: &str = "strategy";

    /// Payload field carrying how many strict-valid candidates entered
    /// the unified scoring.
    pub const FIELD_CANDIDATES: &str = "candidates";

    /// Outcome: standard parse failed; a repair candidate (quote-repair or
    /// jsonrepair-rs) won the unified scoring.
    pub const OUTCOME_OK_REPAIRED: &str = "ok_repaired";

    /// Outcome: standard parse failed and no candidate survived (quote-repair
    /// found none and jsonrepair-rs failed too).
    pub const OUTCOME_ERR_REPAIR: &str = "err_repair";
}

/// Wire contract for the `subcmd_not_found` telemetry event.
///
/// Emitted when `CliRun::execute` receives a subcommand that does not
/// match any registered service, helper, or built-in command.
///
/// Payload fields:
///
/// | Field     | Type   | Description                                     |
/// |-----------|--------|-------------------------------------------------|
/// | `subcmd`  | string | Subcommand name as typed by the user (no args)  |
pub mod subcmd_not_found {
    /// Event kind name.
    pub const KIND: &str = "subcmd_not_found";

    /// Payload field: the unrecognised subcommand name.
    pub const FIELD_SUBCMD: &str = "subcmd";
}

/// Wire contract for the `set_path` telemetry event.
///
/// Emitted by `apply_set_ops` to track `--set path=value` adoption and
/// error rates. Only emitted when `--set` items are present (count > 0).
/// A single event covers all `--set` items in one command.
///
/// Payload fields:
///
/// | Field             | Type   | Description                           |
/// |-------------------|--------|---------------------------------------|
/// | `outcome`         | string | `"ok"` or `"err"`                     |
/// | `count`           | u32    | Total number of `--set` items         |
/// | `typed_by_schema` | u32    | Items where schema type (A) was used  |
pub mod set_path {
    /// Event kind name.
    pub const KIND: &str = "set_path";

    /// Payload field: outcome status.
    pub const FIELD_OUTCOME: &str = "outcome";

    /// Payload field: total `--set` item count.
    pub const FIELD_COUNT: &str = "count";

    /// Payload field: number of items typed via schema (strategy A).
    pub const FIELD_TYPED_BY_SCHEMA: &str = "typed_by_schema";

    /// Outcome: all `--set` items applied successfully.
    pub const OUTCOME_OK: &str = "ok";

    /// Outcome: one or more `--set` items failed.
    pub const OUTCOME_ERR: &str = "err";
}

/// Wire contract for the `schema_parse_error` telemetry event.
///
/// Emitted by the `EmitDefaultOnError` / `EmitVecSkipError` / `EmitMapSkipError`
/// serde adapters when a discovery-schema field or element fails to deserialize
/// and is either silently-defaulted or skipped, so the otherwise-silent
/// decision becomes observable.
///
/// The payload carries only a stable `field` label for aggregation.
/// Diagnostic details (error message, skipped count) are logged via
/// `tracing::warn!` — not carried in telemetry payload.
///
/// Payload fields:
///
/// | Field    | Type   | Description                                         |
/// |----------|--------|-----------------------------------------------------|
/// | `field`  | string | Stable field label, e.g. `"MethodSchema.request"`   |
pub mod schema_parse_error {
    /// Event kind name.
    pub const KIND: &str = "schema_parse_error";

    /// Payload field: stable `Type.field` label identifying the error site.
    pub const FIELD_FIELD: &str = "field";
}

/// Wire contract for the `file_save_invalid` telemetry event.
///
/// Emitted when `process_file_save` encounters an unexpected value shape
/// at the directive path. Two outcomes cover the invalid cases:
///
/// | `outcome`          | Meaning                                          |
/// |--------------------|--------------------------------------------------|
/// | `"invalid_object"` | Value is an Object but deserialization failed     |
/// | `"invalid_type"`   | Value is neither a String nor an Object           |
///
/// Payload fields:
///
/// | Field     | Type   | Description                                     |
/// |-----------|--------|-------------------------------------------------|
/// | `outcome` | string | `"invalid_object"` or `"invalid_type"`           |
/// | `error`   | string | Deserialization error message (invalid_object)   |
pub mod file_save_invalid {
    /// Event kind name.
    pub const KIND: &str = "file_save_invalid";

    /// Payload field: outcome status.
    pub const FIELD_OUTCOME: &str = "outcome";

    /// Payload field: error message (for `invalid_object` outcome).
    pub const FIELD_ERROR: &str = "error";

    /// Outcome: Object value failed `serde_json::from_value::<FileSavePayload>`.
    pub const OUTCOME_INVALID_OBJECT: &str = "invalid_object";

    /// Outcome: value is neither String nor Object.
    pub const OUTCOME_INVALID_TYPE: &str = "invalid_type";
}
