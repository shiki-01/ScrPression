use dioxus::html::input::placeholder;
use dioxus::prelude::*;
use crate::state::app_state::{AppState, BlockList};
use crate::models::block::{Block, BlockContent, BlockType, Connection, EnumBlockContent, ContentValue, Position, Size};
use crate::components::block::{DraggableBlock, BlockData};

#[component]
pub fn Sidebar() -> Element {
    let mut app_state = use_context::<Signal<AppState>>();

    use_effect(move || {
        let mut state = app_state.write();

        state.add_block_list(BlockList {
            name: "block_1".to_string(),
            block: Block {
                id: "".to_string(),
                block_type: BlockType::Move,
                title: "Move".to_string(),
                output: "output".to_string(),
                content: vec![
                    BlockContent {
                        id: "content1".to_string(),
                        content: EnumBlockContent::ContentValue(
                            ContentValue {
                                title: "Input".to_string(),
                                value: "input".to_string(),
                                placeholder: Some("Enter input".to_string()),
                            }
                        )
                    }
                ],
                connection: Connection::Both,
                child_id: None,
                parent_id: None,
                position: Position { x: 0.0, y: 0.0 },
                size: Size { width: 150.0, height: 60.0 },
                z_index: 0,
            },
        });
        state.add_block_list(BlockList {
            name: "block_2".to_string(),
            block: Block {
                id: "block1".to_string(),
                block_type: BlockType::Move,
                title: "Move".to_string(),
                output: "output".to_string(),
                content: vec![],
                connection: Connection::Both,
                child_id: None,
                parent_id: None,
                position: Position { x: 0.0, y: 0.0 },
                size: Size { width: 150.0, height: 60.0 },
                z_index: 1,
            },
        });
    });

    rsx!(
        div {
            id: "sidebar",

            ul {
                style: "list-style-type: none; padding: 0; margin: 0;",
                
                for block_list in app_state.read().get_all_block_lists().iter() {
                    li {
                        DraggableBlock {
                            block_data: BlockData::BlockList((*block_list).clone()),
                            on_drag_start: move |(id, offset_x, offset_y)| {
                                app_state.write().dragging = Some((id, offset_x, offset_y));
                            }
                        }
                    }
                }
            }
        }
    )
}
