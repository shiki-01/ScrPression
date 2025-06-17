use dioxus::prelude::*;
use crate::{state::app_state::AppState};

const FAVICON: Asset = asset!("/icons/favicon.ico");
const MAIN_CSS: Asset = asset!("/assets/main.css");

#[component]
pub fn App() -> Element {
    use_context_provider(|| Signal::new(AppState::default()));

    let mut app_state = use_context::<Signal<AppState>>();
    
    rsx! {
        document::Title { "tpl-dioxus" }
        document::Meta { charset: "UTF-8" }
        document::Meta { name: "viewport", content: "width=device-width, initial-scale=1.0" }
        document::Link { rel: "icon", href: FAVICON }
        document::Link { rel: "stylesheet", href: "https://cdn.master.co/normal.css" }
        document::Link { rel: "stylesheet", href: MAIN_CSS }
        document::Script { src: "https://cdn.master.co/css-runtime@rc" }

        div {
            id: "app-container",

            onmousemove: {
                move |e: MouseEvent| {
                    let dragging_info = app_state.read().dragging.clone();
                    if let Some((id, offset_x, offset_y)) = dragging_info {
                        let mouse_x = e.page_coordinates().x;
                        let mouse_y = e.page_coordinates().y;

                        let mut blockX = 0.0;
                        let mut blockY = 0.0;

                        if let Some(_block) = app_state.write().blocks.get_mut(&id) {
                            blockX = mouse_x - offset_x;
                            blockY = mouse_y - offset_y;
                        }

                        app_state.write().update_block_position(&id, blockX, blockY);
                    }
                }
            },
            onmouseup: {
                move |_| {
                    app_state.write().dragging = None;
                }
            },

            crate::components::sidebar::Sidebar {},
            
            div {
                id: "canvas-output",

                crate::components::board::Board {},
                crate::components::output::Output {}
            }
        }
    }
}
