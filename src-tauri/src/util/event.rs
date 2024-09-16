use dyn_clone::{clone_trait_object, DynClone};
use erased_serde::serialize_trait_object;
use std::fmt::Debug;
use tauri::{AppHandle, Manager};
use tokio::sync::mpsc;

pub trait TauriEvent: DynClone + erased_serde::Serialize + Debug + Send + 'static {
    fn event_name(&self) -> &'static str;
}

clone_trait_object!(TauriEvent);
serialize_trait_object!(TauriEvent);

#[derive(Debug, Clone)]
struct TauriEventEmission {
    event: Box<dyn TauriEvent>,
}

#[derive(Clone)]
pub struct TauriEventEmitter {
    tx: mpsc::Sender<TauriEventEmission>,
}

impl TauriEventEmitter {
    pub fn new() -> (Self, impl FnOnce(AppHandle)) {
        let (tx, rx) = mpsc::channel(32);
        (Self { tx }, |app_handle| tauri_event_listen(app_handle, rx))
    }

    pub async fn emit<E: TauriEvent>(&self, event: E) {
        let emission = TauriEventEmission {
            event: Box::new(event),
        };
        self.tx.send(emission).await.unwrap();
    }
}

fn tauri_event_listen(app_handle: AppHandle, mut rx: mpsc::Receiver<TauriEventEmission>) {
    tokio::spawn(async move {
        while let Some(emission) = rx.recv().await {
            println!("Received event: {:?}", emission);
            app_handle
                .emit_all(emission.event.event_name(), emission.event)
                // TODO: Handle error
                .expect("failed to emit event.");
        }
    });
}
