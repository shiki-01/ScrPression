#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use dioxus::prelude::LaunchBuilder;
use dioxus_desktop::{tao::window::Icon, Config, WindowBuilder};

mod app;
pub mod components;
pub mod models;
pub mod state;
pub mod utils;

const ICON_BYTES: &[u8] = include_bytes!("../icons/favicon.ico");

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let icon = load_icon_from_bytes(ICON_BYTES).ok();

    LaunchBuilder::desktop()
        .with_cfg(
            Config::new().with_window(
                WindowBuilder::new()
                    .with_window_icon(icon)
            )
        )
        .launch(app::App);

    Ok(())
}

fn load_icon_from_bytes(bytes: &[u8]) -> Result<Icon, Box<dyn std::error::Error>> {
    let img = image::load_from_memory(bytes)?.into_rgba8();
    let (width, height) = img.dimensions();
    let raw_data = img.into_raw();
    Ok(Icon::from_rgba(raw_data, width, height)?)
}
