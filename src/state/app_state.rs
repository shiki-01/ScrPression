use std::collections::HashMap;
use crate::models::block::{Block, BlockContent};
use uuid::Uuid;

#[derive(Clone, PartialEq)]
pub struct BlockList {
    pub name: String,
    pub block: Block,
}

#[derive(Default, Clone)]
pub struct AppState {
    pub block_list: HashMap<String, BlockList>,
    pub blocks: HashMap<String, Block>,
    pub dragging: Option<(String, f64, f64)>,
}

impl AppState {
    pub fn add_block_list(&mut self, block: BlockList) {
        self.block_list.insert(
            block.name.clone(),
            block.clone()
        );
    }

    pub fn remove_block_list(&mut self, name: &str) {
        self.block_list.remove(name);
    }

    pub fn clear_block_list(&mut self) {
        self.block_list.clear();
    }

    pub fn get_block_list(&self, name: &str) -> Option<&BlockList> {
        self.block_list.get(name)
    }

    pub fn get_all_block_lists(&self) -> Vec<&BlockList> {
        self.block_list.values().collect()
    }

    pub fn add_block(&mut self, name: &str, x: f64, y: f64) -> Option<String> {
        if let Some(template) = self.block_list.get(name) {
            let id = Uuid::new_v4().to_string();
            let mut new_block = template.block.clone();
            new_block.id = id.clone();
            new_block.position.x = x;
            new_block.position.y = y;
            self.blocks.insert(id.clone(), new_block);
            Some(id)
        } else {
            None
        }
    }
    
    pub fn update_block_position(&mut self, id: &str, x: f64, y: f64) {
        if let Some(block) = self.blocks.get_mut(id) {
            block.position.x = x;
            block.position.y = y;
        }
    }


    pub fn update_block_content(&mut self, id: &str, content_id: &str, content_value: &str) {
        if let Some(block) = self.blocks.get_mut(id) {
            if let Some(content) = block.content.iter_mut().find(|c| c.id == content_id) {
                match &mut content.content {
                    crate::models::block::EnumBlockContent::ContentValue(ref mut cv) => {
                        cv.value = content_value.to_string();
                    },
                    _ => {}
                }
            }
        }
    }

    pub fn remove_block(&mut self, id: &str) {
        self.blocks.remove(id);
    }

    pub fn clear_blocks(&mut self) {
        self.blocks.clear();
    }

    pub fn get_block(&self, id: &str) -> Option<&Block> {
        self.blocks.get(id)
    }

    pub fn get_all_blocks(&self) -> Vec<&Block> {
        self.blocks.values().collect()
    }
}
