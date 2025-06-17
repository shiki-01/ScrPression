#[derive(Clone, Debug, PartialEq)]
pub struct Position {
    pub x: f64,
    pub y: f64,
}

#[derive(Clone, Debug, PartialEq)]
pub struct Size {
    pub width: f64,
    pub height: f64,
}

#[derive(Clone, Debug, PartialEq)]
pub enum Connection {
    Input,
    Output,
    Both,
    None,
}

#[derive(Clone, Debug, PartialEq)]
pub enum BlockType {
    Flag,
    Works,
    Move,
    Composition,
}

#[derive(Clone, Debug, PartialEq)]
pub struct ContentValue {
    pub title: String,
    pub value: String,
    pub placeholder: Option<String>,
}

#[derive(Clone, Debug, PartialEq)]
pub enum Separator {
    None,
    Space,
    Newline,
}

#[derive(Clone, Debug, PartialEq)]
pub struct Options {
    pub id: String,
    pub title: String,
    pub value: String,
}

#[derive(Clone, Debug, PartialEq)]
pub struct ContentSelector {
    pub title: String,
    pub value: String,
    pub options: Vec<Options>,
    pub placeholder: Option<String>,
}

#[derive(Clone, Debug, PartialEq)]
pub enum EnumBlockContent {
    ContentValue(ContentValue),
    ContentSelector(ContentSelector),
    Separator(Separator),
}

#[derive(Clone, Debug, PartialEq)]
pub struct BlockContent {
    pub id: String,
    pub content: EnumBlockContent,
}

#[derive(Clone, PartialEq)]
pub struct Block {
    pub id: String,
    pub block_type: BlockType,
    pub title: String,
    pub output: String,
    pub content: Vec<BlockContent>,
    pub connection: Connection,
    pub child_id: Option<String>,
    pub parent_id: Option<String>,
    pub position: Position,
    pub size: Size,
    pub z_index: i32,
}

impl Block {
    pub fn new(
        id: String,
        block_type: BlockType,
        title: String,
        position: Position,
    ) -> Self {
        Self {
            id,
            block_type,
            title,
            output: String::new(),
            content: Vec::new(),
            connection: Connection::None,
            child_id: None,
            parent_id: None,
            position,
            size: Size { width: 150.0, height: 60.0 },
            z_index: 0,
        }
    }
}
