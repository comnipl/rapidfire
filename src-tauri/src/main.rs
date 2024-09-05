// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

pub mod msgbox;
pub mod volume;

use std::fs::File;
use std::io::BufReader;
use std::ops::Sub;
use std::thread::{self, sleep};
use std::time::{SystemTime, UNIX_EPOCH};

use rodio::{Decoder, OutputStream, Sink, Source};
use serde::{Deserialize, Serialize};
use tauri::Manager;
use tokio::fs;
use tokio::sync::{mpsc, oneshot};
use ulid::Ulid;

use self::volume::volume;

enum Event {
    VolumeWarning { is_full: bool },
    Project { project: Project },
    Dispatches { dispatches: Vec<DispatchedPlay> },
}

enum ProjectMessage {
    GetProject {
        tx: oneshot::Sender<Project>,
    },
    PatchSoundVolume {
        scene_id: String,
        sound_id: String,
        volume: u32,
    },
    PatchSoundLooped {
        scene_id: String,
        sound_id: String,
        looped: bool,
    },
    DispatchPlay {
        scene_id: String,
        sound_id: String,
    },
    StopDispatchedPlays {
        id: String,
        fade: bool,
    },
    RefreshDispatchedPlays {
        target: DispatchedPlay,
    },
    RemoveDispatchedPlay {
        id: String,
    },
    PanicButton,
}

enum DispatchMessage {
    Stop { fade: bool },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct DispatchedPlay {
    id: String,
    sound: SoundInstance,
    last_played_when: f64,
    last_played_from: f64,
    total_duration: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
enum SoundVariant {
    Bgm,
    Se,
    Voice,
}

struct RapidFireState {
    project_tx: mpsc::Sender<ProjectMessage>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct PatchSoundVolume {
    scene_id: String,
    sound_id: String,
    volume: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct PatchSoundLooped {
    scene_id: String,
    sound_id: String,
    looped: bool,
}

#[derive(Debug, Clone, Serialize)]
struct VolumeWarningPayload {
    is_full: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct SoundInstance {
    id: String,
    display_name: String,
    path: String,
    volume: u32,
    looped: bool,
    variant: SoundVariant,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct SoundScene {
    id: String,
    display_name: String,
    sounds: Vec<SoundInstance>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Project {
    display_name: String,
    scenes: Vec<SoundScene>,
}

#[tauri::command]
fn get_volume_warning() -> VolumeWarningPayload {
    VolumeWarningPayload {
        is_full: volume().map(|v| v >= 0.995).unwrap_or(true),
    }
}

#[tauri::command]
async fn patch_sound_volume(
    state: tauri::State<'_, RapidFireState>,
    payload: PatchSoundVolume,
) -> Result<(), ()> {
    state
        .project_tx
        .send(ProjectMessage::PatchSoundVolume {
            scene_id: payload.scene_id,
            sound_id: payload.sound_id,
            volume: payload.volume,
        })
        .await
        .unwrap();
    Ok(())
}

#[tauri::command]
async fn stop_dispatched_play(
    state: tauri::State<'_, RapidFireState>,
    id: String,
    fade: bool,
) -> Result<(), ()> {
    state
        .project_tx
        .send(ProjectMessage::StopDispatchedPlays { id, fade })
        .await
        .unwrap();
    Ok(())
}

#[tauri::command]
async fn patch_sound_looped(
    state: tauri::State<'_, RapidFireState>,
    payload: PatchSoundLooped,
) -> Result<(), ()> {
    state
        .project_tx
        .send(ProjectMessage::PatchSoundLooped {
            scene_id: payload.scene_id,
            sound_id: payload.sound_id,
            looped: payload.looped,
        })
        .await
        .unwrap();
    Ok(())
}

#[tauri::command]
async fn dispatch_play(
    state: tauri::State<'_, RapidFireState>,
    scene_id: String,
    sound_id: String,
) -> Result<(), ()> {
    state
        .project_tx
        .send(ProjectMessage::DispatchPlay { scene_id, sound_id })
        .await
        .unwrap();
    Ok(())
}

#[tauri::command]
async fn panic_button(state: tauri::State<'_, RapidFireState>) -> Result<(), ()> {
    state
        .project_tx
        .send(ProjectMessage::PanicButton)
        .await
        .unwrap();
    Ok(())
}

#[tauri::command]
async fn get_project(state: tauri::State<'_, RapidFireState>) -> Result<Project, ()> {
    let (tx, rx) = oneshot::channel();
    state
        .project_tx
        .send(ProjectMessage::GetProject { tx })
        .await
        .unwrap();
    rx.await.map_err(|_| ())
}

#[tokio::main]
async fn main() {
    let (event_tx_original, mut event_rx) = mpsc::channel(32);
    let (project_tx, mut project_rx) = mpsc::channel(32);

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
                        Event::Project { project } => {
                            app_handle
                                .emit_all("project", project)
                                .expect("failed to emit event");
                        }
                        Event::Dispatches { dispatches } => {
                            app_handle
                                .emit_all("dispatches", dispatches)
                                .expect("failed to emit event");
                        }
                    }
                }
            });

            Ok(())
        })
        .manage(RapidFireState {
            project_tx: project_tx.clone(),
        })
        .invoke_handler(tauri::generate_handler![
            get_volume_warning,
            get_project,
            patch_sound_volume,
            patch_sound_looped,
            dispatch_play,
            stop_dispatched_play,
            panic_button
        ])
        .build(tauri::generate_context!())
        .expect("error while running tauri application");

    if let Some(mut rx) = volume::receive_volume_change().await {
        let event_tx = event_tx_original.clone();
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

    let event_tx = event_tx_original.clone();
    tokio::spawn(async move {
        let project = fs::read_to_string("projects/index.json")
            .await
            .expect("failed to read project");
        let mut project =
            serde_json::from_str::<Project>(&project).expect("failed to parse project");

        let mut dispatched_map: Vec<(DispatchedPlay, mpsc::Sender<DispatchMessage>)> = vec![];

        let update = |event_tx: mpsc::Sender<Event>, project: Project| async move {
            event_tx
                .clone()
                .send(Event::Project {
                    project: project.clone(),
                })
                .await
                .expect("failed to send project refresh");
            let text = serde_json::to_string_pretty(&project).expect("failed to serialize project");
            fs::write("projects/index.json", text)
                .await
                .expect("failed to write project");
        };

        let dispatch_refresh =
            |event_tx: mpsc::Sender<Event>,
             dispatched_map: Vec<(DispatchedPlay, mpsc::Sender<DispatchMessage>)>| async move {
                event_tx
                    .send(Event::Dispatches {
                        dispatches: dispatched_map
                            .iter()
                            .map(|(play, _)| play.clone())
                            .collect(),
                    })
                    .await
                    .unwrap();
            };

        while let Some(message) = project_rx.recv().await {
            match message {
                ProjectMessage::GetProject { tx } => {
                    tx.send(project.clone()).unwrap();
                }
                ProjectMessage::PatchSoundVolume {
                    scene_id,
                    sound_id,
                    volume,
                } => {
                    if let Some(scene) =
                        project.scenes.iter_mut().find(|scene| scene.id == scene_id)
                    {
                        if let Some(sound) =
                            scene.sounds.iter_mut().find(|sound| sound.id == sound_id)
                        {
                            sound.volume = volume;
                        }
                    }
                    update(event_tx.clone(), project.clone()).await;
                }
                ProjectMessage::PatchSoundLooped {
                    scene_id,
                    sound_id,
                    looped,
                } => {
                    if let Some(scene) =
                        project.scenes.iter_mut().find(|scene| scene.id == scene_id)
                    {
                        if let Some(sound) =
                            scene.sounds.iter_mut().find(|sound| sound.id == sound_id)
                        {
                            sound.looped = looped;
                        }
                    }
                    update(event_tx.clone(), project.clone()).await;
                }
                ProjectMessage::DispatchPlay { scene_id, sound_id } => {
                    if let Some(scene) = project.scenes.iter().find(|scene| scene.id == scene_id) {
                        if let Some(sound) = scene.sounds.iter().find(|sound| sound.id == sound_id)
                        {
                            let dispatch = DispatchedPlay {
                                id: Ulid::new().to_string(),
                                sound: sound.clone(),
                                last_played_when: SystemTime::now()
                                    .duration_since(UNIX_EPOCH)
                                    .expect("time went backwards")
                                    .as_secs_f64(),
                                last_played_from: 0.0,
                                total_duration: 0.0,
                            };
                            let (tx, rx) = mpsc::channel(32);
                            dispatched_map.push((dispatch.clone(), tx));
                            dispatch_play_spawn(dispatch, rx, project_tx.clone()).await;
                        }
                    }
                }
                ProjectMessage::RefreshDispatchedPlays { target } => {
                    if let Some(item) = dispatched_map
                        .iter_mut()
                        .find(|(play, _)| play.id == target.id)
                    {
                        item.0 = target;
                    }
                    dispatch_refresh(event_tx.clone(), dispatched_map.clone()).await;
                }
                ProjectMessage::RemoveDispatchedPlay { id } => {
                    dispatched_map.retain(|(play, _)| play.id != id);
                    dispatch_refresh(event_tx.clone(), dispatched_map.clone()).await;
                }
                ProjectMessage::StopDispatchedPlays { id, fade } => {
                    if let Some(item) = dispatched_map.iter_mut().find(|(play, _)| play.id == id) {
                        item.1
                            .send(DispatchMessage::Stop { fade })
                            .await
                            .expect("failed to send stop message");
                    }
                }
                ProjectMessage::PanicButton => {
                    for (_, tx) in dispatched_map.iter() {
                        tx.send(DispatchMessage::Stop { fade: false })
                            .await
                            .expect("failed to send stop message");
                    }
                    dispatched_map.clear();
                    dispatch_refresh(event_tx.clone(), dispatched_map.clone()).await;
                }
            }
        }

        println!("{:?}", project);
    });

    app.run(|_app_handle, _webview| {});
}

async fn dispatch_play_spawn(
    mut play: DispatchedPlay,
    mut receiver: mpsc::Receiver<DispatchMessage>,
    event_tx: mpsc::Sender<ProjectMessage>,
) {
    thread::spawn(move || {
        let file = BufReader::new(File::open(play.clone().sound.path).unwrap());
        let source = Decoder::new(file).unwrap();

        let (_stream, stream_handle) = OutputStream::try_default().unwrap();
        let sink = Sink::try_new(&stream_handle).unwrap();
        if let Some(duration) = source.total_duration() {
            play.total_duration = duration.as_secs_f64();
            event_tx
                .blocking_send(ProjectMessage::RefreshDispatchedPlays {
                    target: play.clone(),
                })
                .unwrap();
        }
        thread::scope(|s| {
            sink.append(source);
            sink.set_volume(play.sound.volume as f32 / 100.0);
            s.spawn(|| {
                #[allow(clippy::never_loop)]
                while let Some(message) = receiver.blocking_recv() {
                    match message {
                        DispatchMessage::Stop { fade } => {
                            if fade {
                                for _ in 0..100 {
                                    sink.set_volume(sink.volume().sub(0.01).max(0.0));
                                    thread::sleep(std::time::Duration::from_millis(10));
                                }
                            }
                            sink.stop();
                            break;
                        }
                    }
                }
            });
            s.spawn(|| {
                loop {
                    sink.sleep_until_end();
                    if sink.empty() {
                        break;
                    }
                }
                let _ = event_tx.blocking_send(ProjectMessage::RemoveDispatchedPlay {
                    id: play.clone().id,
                });
            });
            s.spawn(|| loop {
                let file = BufReader::new(File::open(play.clone().sound.path).unwrap());
                let source = Decoder::new(file).unwrap();
                sleep(source.total_duration().unwrap() / 2);
                if 5 > sink.len() && sink.len() > 0 && play.sound.looped {
                    sink.append(source);
                    let mut new_play = play.clone();
                    new_play.last_played_from = 0.0;
                    new_play.last_played_when = SystemTime::now()
                        .duration_since(UNIX_EPOCH)
                        .expect("time went backwards")
                        .as_secs_f64();
                    event_tx
                        .blocking_send(ProjectMessage::RefreshDispatchedPlays { target: new_play })
                        .unwrap();
                } else {
                    break;
                }
            });
        });
    });
}
