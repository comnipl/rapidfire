// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

pub mod msgbox;
pub mod volume;

use crate::msgbox::msgbox;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}
#[tokio::main]
async fn main() {
    let app = tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet])
        .build(tauri::generate_context!())
        .expect("error while running tauri application");

    msgbox("Hello, World!").unwrap();

    if let Some(mut rx) = volume::receive_volume_change().await {
        tokio::spawn(async move {
            loop {
                let volume = *rx.borrow_and_update();
                let message = format!("Volume changed: {:?}", volume);
                msgbox(&message).unwrap();
                if rx.changed().await.is_err() {
                    break;
                }
            }
        });
    }

    app.run(|app_handle, _webview| {});
}
