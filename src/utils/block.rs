#[derive(Debug, Clone, PartialEq, Eq)]
pub enum PathType {
    Flag,
    Works,
    Loop,
    Move,
    Composition,
    Value,
}

#[derive(Debug, Clone, PartialEq)]
pub struct Size {
    pub width: f64,
    pub height: f64,
}

#[derive(Debug, Clone, PartialEq)]
pub struct Path {
    pub type_: PathType,
    pub size: Size,
}

impl Size {
    pub fn new(width: f64, height: f64) -> Self {
        Size { width, height }
    }
}

pub fn get_path(path_type: &PathType, size: &Size) -> Path {
    Path {
        type_: path_type.clone(),
        size: size.clone(),
    }
}

pub fn generate_path_string(path_type: &PathType, size: &Size) -> String {
    let set_width = size.width - 2.0;
    match path_type {
        PathType::Flag => {
            format!(
                "M 14 2 L 42 2 L {} 2 Q {} 2 {} 14 L {} {} Q {} {} {} {} L 40 {} L 40 {} Q 40 {} 36 {} L 20 {} Q 16 {} 16 {} L 16 {} L 4 {} Q 2 {} 2 {} L 2 14 Q 2 2 14 2 Z",
                set_width - 14.0,
                set_width,
                set_width,
                set_width,
                size.height - 18.0,
                set_width,
                size.height - 14.0,
                set_width - 4.0,
                size.height - 14.0,
                size.height - 14.0,
                size.height - 10.0,
                size.height - 8.0,
                size.height - 8.0,
                size.height - 8.0,
                size.height - 8.0,
                size.height - 10.0,
                size.height - 14.0,
                size.height - 14.0,
                size.height - 14.0,
                size.height - 18.0
            )
        }
        PathType::Works | PathType::Move | PathType::Composition => {
            format!(
                "M 4 2 L 14 2 L 14 4 Q 14 8 20 8 L 38 8 Q 42 8 42 4 L 42 2 L {} 2 Q {} 2 {} 4 L {} {} Q {} {} {} {} L 40 {} L 40 {} Q 40 {} 36 {} L 20 {} Q 16 {} 16 {} L 16 {} L 4 {} Q 2 {} 2 {} L 2 4 Q 2 2 4 2 Z",
                set_width - 4.0,
                set_width,
                set_width,
                set_width,
                size.height - 18.0,
                set_width,
                size.height - 14.0,
                set_width - 4.0,
                size.height - 14.0,
                size.height - 14.0,
                size.height - 10.0,
                size.height - 8.0,
                size.height - 8.0,
                size.height - 8.0,
                size.height - 8.0,
                size.height - 10.0,
                size.height - 14.0,
                size.height - 14.0,
                size.height - 14.0,
                size.height - 18.0
            )
        }
        PathType::Loop | PathType::Value => {
            format!(
                "M 4 2 L 14 2 L 14 4 Q 14 8 20 8 L 38 8 Q 42 8 42 4 L 42 2 L {} 2 Q {} 2 {} 4 L {} {} Q {} {} {} {} L 48 {} L 48 {} Q 48 {} 44 {} L 28 {} Q 24 {} 24 {} L 24 {} L 12 {} Q 8 {} 8 {} L 8 {} Q 8 {} 14 {} L {} {} Q {} {} {} {} L {} {} Q {} {} {} {} L 4 {} Q 2 {} 2 {} L 2 4 Q 2 2 4 2 Z",
                set_width - 4.0,
                set_width,
                set_width,
                set_width,
                size.height - 18.0,
                set_width,
                size.height - 14.0,
                set_width - 4.0,
                size.height - 14.0,
                size.height - 14.0,
                size.height - 10.0,
                size.height - 8.0,
                size.height - 8.0,
                size.height - 8.0,
                size.height - 8.0,
                size.height - 10.0,
                size.height - 14.0,
                size.height - 14.0,
                size.height - 14.0,
                size.height - 10.0,
                size.height + 29.0,
                size.height + 33.0,
                size.height + 33.0,
                set_width - 4.0,
                size.height + 33.0,
                set_width,
                size.height + 33.0,
                set_width,
                size.height + 37.0,
                set_width,
                size.height + 44.0,
                set_width,
                size.height + 48.0,
                set_width - 4.0,
                size.height + 48.0,
                size.height + 48.0,
                size.height + 48.0,
                size.height + 44.0
            )
        }
    }
}