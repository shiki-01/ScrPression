import { Block } from './class';

type Position = {
	x: number;
	y: number;
};

type ValueContent = {
	title: string;
	value: string;
	placeholder: string;
};

type SeparatorContent = {
	type: 'line' | 'space';
};

type SelectContent = {
	title: string;
	value: string;
	placeholder: string;
	options: { id: string; title: string }[];
};

interface BaseBlockContent<T, C> {
	id: string;
	type: T;
	content: C;
}

type ValueBlockContent = BaseBlockContent<'value', ValueContent>;
type SeparatorBlockContent = BaseBlockContent<'separator', SeparatorContent>;
type SelectBlockContent = BaseBlockContent<'select', SelectContent>;

type BlockContent = ValueBlockContent | SeparatorBlockContent | SelectBlockContent;

interface ReadonlyBlockType {
	readonly id: string;
	readonly type: 'flag' | ('move' | 'composition' | 'works') | 'loop' | 'value';
	readonly title: string;
	readonly output: string;
	readonly connections: {
		input: Position | null;
		output: Position | null;
	};
}

interface BlockType extends ReadonlyBlockType {
	position: Position;
	size: { width: number; height: number };
	contents: BlockContent[];
	childId: string;
	parentId: string;
	depth: number;
	zIndex: number;
}

type BlockStoreEvent = {
	type: 'add' | 'remove' | 'update' | 'clear' | 'output';
	id?: string;
	block?: Block;
	output?: string;
};

export {
	Position,
	ValueContent,
	SeparatorContent,
	SelectContent,
	BaseBlockContent,
	ValueBlockContent,
	SeparatorBlockContent,
	SelectBlockContent,
	BlockContent,
	ReadonlyBlockType,
	BlockType,
	BlockStoreEvent
};
