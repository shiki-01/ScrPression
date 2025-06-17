use crate::models::block::BlockContent;
use crate::state::app_state::AppState;
use crate::utils::block::{generate_path_string, PathType};
use crate::{
    components::block,
    models::block::{Block, EnumBlockContent},
    state::app_state::BlockList,
    utils::block::Size,
};
use tracing::{info, warn, error, debug};
use dioxus::prelude::*;

#[derive(Clone, PartialEq)]
pub enum BlockData {
    Block(Block),
    BlockList(BlockList),
}

#[component]
pub fn DraggableBlock(
    block_data: BlockData,
    on_drag_start: EventHandler<(String, f64, f64)>,
) -> Element {
    let mut app_state = use_context::<Signal<AppState>>();
    let mut is_dragging = use_signal(|| false);
    let mut size_signal = use_signal(|| Size::new(150.0, 60.0));

    let content_ref = use_signal(|| None::<MountedData>);

    let (block_id, _is_list) = match &block_data {
        BlockData::Block(block) => (block.id.clone(), false),
        BlockData::BlockList(block_list) => (block_list.name.clone(), true),
    };

    let block_contents = match &block_data {
        BlockData::Block(block) => block.content.clone(),
        BlockData::BlockList(block_list) => block_list.block.content.clone(),
    };

    let mut is_calculating = use_signal(|| false);

    // サイズ計算関数を簡素化
    let calculate_size = use_callback(move |_| {
        if is_calculating() {
            return; // 既に計算中の場合は早期リターン
        }
        
        is_calculating.set(true);
        info!("Calculating size for block:");
        
        spawn({
            let content_ref = content_ref.clone();
            
            async move {
                // 短い遅延でDOMの安定を待つ
                gloo_timers::future::TimeoutFuture::new(50).await;
                
                if let Some(mounted) = content_ref.read().as_ref() {
                    if let Ok(rect) = mounted.get_client_rect().await {
                        let content_width = rect.width();
                        let content_height = rect.height();
                        
                        if content_width > 0.0 && content_height > 0.0 {
                            let min_width = 150.0;
                            let min_height = 60.0;
                            
                            let new_width = (content_width + 40.0).max(min_width);
                            let new_height = (content_height + 40.0).max(min_height);
                            
                            let new_size = Size::new(new_width, new_height);
                            let current_size = size_signal.read().clone();
                            let size_changed = (current_size.width - new_width).abs() > 1.0 
                                || (current_size.height - new_height).abs() > 1.0;
                            
                            if size_changed {
                                size_signal.set(new_size);
                            }
                        }
                    }
                }
                
                is_calculating.set(false);
            }
        });
    });

    // ドラッグ状態の更新
    use_effect({
        let app_state = app_state.clone();
        let block_id = block_id.clone();
        let block_data = block_data.clone();
        
        move || {
            if let BlockData::Block(_) = &block_data {
                let dragging = app_state.read().dragging.clone();
                is_dragging.set(
                    dragging
                        .as_ref()
                        .map(|(id, _, _)| id == &block_id)
                        .unwrap_or(false),
                );
            }
        }
    });

    let mut size = size_signal();
    let path = generate_path_string(&PathType::Move, &size);

    rsx! {
        div {
            class: "_block",
            id: block_id.clone(),
            style: {format!(
                "width: {}px; height: {}px; position: {}; left: {}px; top: {}px; z-index: {}; cursor: {}; margin: {}; filter: drop-shadow({});",
                size.width,
                size.height,
                if let BlockData::Block(_) = &block_data { if is_dragging() { "fixed" } else { "absolute" } } else { "relative" },
                if let BlockData::Block(block) = &block_data { &block.position.x - if is_dragging() { 0.0 } else { 250.0 } } else { 0.0 },
                if let BlockData::Block(block) = &block_data { &block.position.y } else { &0.0 },
                if is_dragging() { "1000" } else { "1" },
                if is_dragging() { "grabbing" } else { "grab" },
                if is_dragging() { "0 0 1px 0" } else { "1px 0 0 0" },
                if is_dragging() { "0 4px 6px rgba(90, 141, 238, 0.5)" } else { "none" }
            )},
            onmousedown: {
                let block_id = block_id.clone();
                move |e: MouseEvent| {
                    e.stop_propagation();

                    match &block_data {
                        BlockData::Block(_) => {
                            let rect = e.element_coordinates();
                            on_drag_start.call((block_id.clone(), rect.x, rect.y));
                        },
                        BlockData::BlockList(block_list) => {
                            let mut state = app_state.write();
                            let rect = e.element_coordinates();
                            let id = state.add_block(&block_list.name, rect.x - 250.0, rect.y);

                            state.dragging = match id {
                                Some(id) => Some((id, 0.0, 0.0)),
                                None => None
                            };
                        }
                    }
                }
            },

            div {
                style: "position: relative; width: {size.width}px; height: {size.height}px;",

                div {
                    class: "block-content",
                    style: "",

                    for block_content in block_contents.iter() {
                        match &block_content.content {
                            EnumBlockContent::ContentValue(content_value) => {
                                rsx! {
                                    div {
                                        class: "content-value",

                                        label {
                                            "{content_value.title.to_string()}"
                                        },

                                        input {
                                            onmousedown: move |e: MouseEvent| {
                                                e.stop_propagation();
                                            },
                                            oninput: {
                                                let content_id = block_content.id.clone();
                                                let block_id = block_id.clone();
                                                let calculate_size = calculate_size.clone();
                                                move |e: Event<FormData>| {
                                                    e.stop_propagation();
                                                    let mut state = app_state.write();
                                                    let value = e.value();

                                                    state.update_block_content(&block_id, &content_id, &value);
                                                    drop(state);

                                                    calculate_size(());
                                                }
                                            },
                                            style: "border: 2px solid #3A6BC1; border-radius: 9999px; min-width: 60px; width: auto; max-width: calc(100% - 40px); flex: 0 1 auto;",
                                            type: "text",
                                            value: "{content_value.value}",
                                        },
                                    }
                                }
                            },
                            EnumBlockContent::ContentSelector(content) => {
                                rsx! { p { "{content.clone().title}" } }
                            },
                            EnumBlockContent::Separator(_separator) => {
                                rsx! { "" }
                            }
                        }
                    }
                }

                svg {
                    width: "{size.width}px",
                    height: "{size.height}px",

                    path {
                        fill: "#5A8DEE",
                        stroke_width: "2.5",
                        stroke: "#3A6BC1",
                        style: "filter: drop-shadow(0 4px 0 #3A6BC1);",
                        d: "{path}",
                    }
                }
            }
        }
    }
}
