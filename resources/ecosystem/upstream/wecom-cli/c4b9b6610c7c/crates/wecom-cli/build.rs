fn main() {
    println!("cargo::rerun-if-env-changed=WECOM_CLI_DEFAULT_LOG_DIR");
    println!("cargo::rerun-if-env-changed=WECOM_CLI_BASE_URL");
    println!("cargo::rerun-if-env-changed=WECOM_CLI_AUTH_ENDPOINT");
}
