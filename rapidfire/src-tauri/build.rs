use std::process::Command;

fn main() {
    println!("cargo:rustc-env=GIT_HASH={}", get_git_hash());
    if let Some(tag) = get_git_tag() {
        println!("cargo:rustc-env=GIT_TAG={}", tag);
    }
    tauri_build::build()
}

fn get_git_hash() -> String {
    let output = Command::new("git")
        .args(["rev-parse", "HEAD"])
        .output()
        .expect("Failed to get git hash");
    String::from_utf8(output.stdout)
        .unwrap()
        .chars()
        .take(7)
        .collect::<String>()
}

fn get_git_tag() -> Option<String> {
    let output = Command::new("git")
        .args(["describe", "--tags", "--exact-match", "HEAD"])
        .output()
        .expect("Failed to execute git command");

    if output.status.success() {
        Some(String::from_utf8(output.stdout).unwrap().trim().to_string())
    } else {
        None
    }
}
