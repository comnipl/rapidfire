use serde::Serialize;

use crate::util::event::{TauriEvent, TauriEventEmitter};
use crate::volume;

#[derive(Debug, Clone, Serialize)]
struct VolumeWarningEvent {
    is_full: bool,
}

impl TauriEvent for VolumeWarningEvent {
    fn event_name(&self) -> &'static str {
        "volume_warning"
    }
}

pub async fn initialize(emitter: TauriEventEmitter) {
    if let Some(mut rx) = volume::receive_volume_change().await {
        tokio::spawn(async move {
            let mut last_is_full = false;
            loop {
                let volume = *rx.borrow_and_update();
                let now_is_full = volume >= 0.995;
                if now_is_full != last_is_full {
                    emitter
                        .emit(VolumeWarningEvent {
                            is_full: now_is_full,
                        })
                        .await;
                    last_is_full = now_is_full;
                }
                if rx.changed().await.is_err() {
                    break;
                }
            }
        });
    }
}
