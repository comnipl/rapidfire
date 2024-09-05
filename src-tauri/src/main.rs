// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

pub mod volume;

use std::fs::File;
use std::io::BufReader;
use std::ops::Sub;
use tauri::api::dialog::blocking::message;

use rodio::{Decoder, OutputStream, Sink, Source};
use tauri::{Manager, RunEvent};

use self::volume::print_message;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}
#[tokio::main]
async fn main() {
    let mut app = tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet])
        .build(tauri::generate_context!())
        .expect("error while running tauri application");

    print_message("Hello, World!").unwrap();

    let volume = volume::get_volume();
    let volume = format!("{:?}", volume);

    print_message(&volume).unwrap();

    app.run(|app_handle, e| match e {
        _ => {}
    })
}
