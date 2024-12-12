type Position = { x: number, y: number };

interface ValueContent {
    text: string;
    placeholder: string;
    value: string;
}

interface SeparatorContent {
    type: 'space' | 'line';
}

interface SelectContent {
    type: 'multi' | 'single';
    options: {
        id: string;
        text: string;
    }[];
}

interface BlockContent {
    id: string;
    type: 'value' | 'separator' | 'select';
    content: ValueContent | SeparatorContent | SelectContent;
}

interface BlockType {
    id: string;
    type: 'flag' | 'block' | 'loop' | 'value';
    title: string;
    output: string;
    position: Position;
    connections: {
        input: Position | null;
        output: Position | null;
    };
    content: BlockContent[];
    childId: string;
    parentId: string;
    depth: number;
    zIndex: number;
}

export type {
    Position,
    ValueContent,
    SeparatorContent,
    SelectContent,
    BlockContent,
    BlockType
}