use std::collections::HashMap;

use crate::components::block::{DraggableBlock, BlockData};
use crate::models::block::Block;
use crate::models::block::Position;
use crate::state::app_state::{AppState, BlockList};
use dioxus::prelude::*;

#[component]
pub fn Board() -> Element {
    let mut app_state = use_context::<Signal<AppState>>();
    let mut dragging_id = use_signal(|| None);

    use_effect(move || {
        let dragging = app_state.read().dragging.clone();
        dragging_id.set(
            dragging.as_ref().map(|(id, _, _)| id.clone())
        );
    });

    let blocks = &app_state.read().blocks.iter()
        .filter(|(id, _)| Some(*id).clone() != dragging_id().as_ref())
        .map(|(id, block)| {
            (id.clone(), block.clone())
        })
        .collect::<HashMap<String, Block>>();

    let dragging_block = if let Some((id, _, _)) = &app_state.read().dragging {
        let block = app_state.read().blocks.get(id).cloned();
        if let Some(block) = block {
            Some(rsx! {
                DraggableBlock {
                    block_data: BlockData::Block(block.clone()),
                    on_drag_start: move |(id, offset_x, offset_y)| {
                        app_state.write().dragging = Some((id, offset_x, offset_y));
                    }
                }
            })
        } else {
            None
        }
    } else {
        None
    };

    rsx!(
        div {
            id: "canvas-wrapper",
            div {
                id: "canvas",

                for (_, block) in blocks {
                    DraggableBlock {
                        block_data: BlockData::Block(block.clone()),
                        on_drag_start: move |(id, offset_x, offset_y)| {
                            app_state.write().dragging = Some((id, offset_x, offset_y));
                        }
                    }
                }
            }

            {
                if let Some(dragging_block) = dragging_block {
                    dragging_block
                } else {
                    rsx! {}
                }
            }
        }
    )
}
