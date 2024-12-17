type Position = { x: number, y: number };

type ValueContent = {
    title: string;
    value: string;
    placeholder: string;
}

type SeparatorContent = {
   type: 'line' | 'space';
}

type SelectContent = {
    title: string;
    options: string[];
    value: string;
}

interface BaseBlockContent<T,C> {
    id: string;
    type: T;
    content: C;
}

interface ValueBlockContent extends BaseBlockContent<'value', ValueContent> {
    id: string;
    type: 'value';
    content: ValueContent;
}

interface SeparatorBlockContent extends BaseBlockContent<'separator', SeparatorContent> {
    id: string;
    type: 'separator';
    content: SeparatorContent;
}

interface SelectBlockContent extends BaseBlockContent<'select', SelectContent> {
    id: string;
    type: 'select';
    content: SelectContent;
}

type BlockContent = ValueBlockContent | SeparatorBlockContent | SelectBlockContent;

interface BlockType {
    id: string;
    type: 'flag' | ('move' | 'composition' | 'works') | 'loop' | 'value';
    title: string;
    output: string;
    position: Position;
    connections: {
        input: Position | null;
        output: Position | null;
    };
    contents: BlockContent[];
    childId: string;
    parentId: string;
    depth: number;
    zIndex: number;
}

export type {
    Position,
    BlockContent,
    BlockType
}