// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

pub mod msgbox;
pub mod volume;

use serde::Serialize;
use tauri::Manager;
use tokio::sync::mpsc;

use self::volume::volume;

enum Event {
    VolumeWarning { is_full: bool },
}

#[derive(Debug, Clone, Serialize)]
struct VolumeWarningPayload {
    is_full: bool,
}

#[tauri::command]
fn get_volume_warning() -> VolumeWarningPayload {
    VolumeWarningPayload {
        is_full: volume().map(|v| v >= 0.995).unwrap_or(true),
    }
}

#[tokio::main]
async fn main() {
    let (event_tx, mut event_rx) = mpsc::channel(32);

    let app = tauri::Builder::default()
        .setup(|app| {
            let app_handle = app.handle();
            tokio::spawn(async move {
                while let Some(event) = event_rx.recv().await {
                    match event {
                        Event::VolumeWarning { is_full } => {
                            app_handle
                                .emit_all("volume_warning", VolumeWarningPayload { is_full })
                                .expect("failed to emit event");
                        }
                    }
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_volume_warning])
        .build(tauri::generate_context!())
        .expect("error while running tauri application");

    if let Some(mut rx) = volume::receive_volume_change().await {
        tokio::spawn(async move {
            let mut last_is_full = false;
            loop {
                let volume = *rx.borrow_and_update();
                let now_is_full = volume >= 0.995;
                if now_is_full != last_is_full {
                    event_tx
                        .send(Event::VolumeWarning {
                            is_full: now_is_full,
                        })
                        .await
                        .unwrap();
                    last_is_full = now_is_full;
                }
                if rx.changed().await.is_err() {
                    break;
                }
            }
        });
    }

    app.run(|_app_handle, _webview| {});
}
