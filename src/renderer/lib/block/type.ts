// Type定義ファイル
type DeepReadonly<T> = {
	readonly [P in keyof T]: T[P] extends Array<infer U>
		? ReadonlyArray<DeepReadonly<U>>
		: T[P] extends object
			? DeepReadonly<T[P]>
			: T[P];
};

// ブロックの位置情報
type Position = {
	x: number;
	y: number;
}

// ブロックのサイズ
type Size = {
	width: number;
	height: number;
}

// ブロックの接続情報
type Connections = {
	input: Position | null;
	output: Position | null;
}

// ブロックの値の内容
type ValueContent = {
	title: string;
	value: string;
	placeholder: string;
}

// ブロックの区切りの種類
type SeparatorContent = {
	type: 'line' | 'space';
}

// ブロックの選択肢の内容
type SelectContent = {
	title: string
	value: string;
	placeholder: string;
	options: {
		id: string;
		title: string;
	}[];
}

// ブロックの値コンテンツ
type ValueBlockContent = {
	id: string;
	type: 'value';
	content: ValueContent;
}

// ブロックの区切りコンテンツ
type SeparatorBlockContent = {
	id: string
	type: 'separator';
	content: SeparatorContent;
}

// ブロックの選択肢コンテンツ
type SelectBlockContent = {
	id: string;
	type: 'select';
	content: SelectContent;
}

// ブロックコンテンツの共用体
type BlockContent = ValueBlockContent | SeparatorBlockContent | SelectBlockContent;

// ブロックの囲み情報
type Enclose = {
	offset: Position;
	connections: {
		output: Position
	};
	contents: BlockType[]
}

// ブロックの基本タイプ
type BlockType = {
	id: string;
	type: 'flag' | ('move' | 'composition' | 'works') | 'loop' | 'value';
	title: string;
	output: string;
	connections: Connections;
	contents: BlockContent[];
	position: Position;
	size: Size;
	childId?: string;
	parentId?: string;
	depth: number;
	zIndex: number;
	enclose?: Enclose;
}

// 読み取り専用のブロックタイプ
type ReadonlyBlockType = DeepReadonly<BlockType>;

// ブロックストアのイベント
type BlockStoreEvent = {
	type: 'add' | 'remove' | 'update' | 'clear' | 'output' | 'load';
	id: string;
	block?: BlockType;
	output?: string;
}

// ブロックストアの状態
type BlockStoreState = {
	blocks: {
		[key: string]: BlockType;
	};
	idList: string[];
	output: string;
}

// 読み取り専用のブロックストア状態
type ReadonlyBlockStoreState = DeepReadonly<BlockStoreState>;

export type {
	Position,
	Size,
	Connections,
	ValueContent,
	SeparatorContent,
	SelectContent,
	ValueBlockContent,
	SeparatorBlockContent,
	SelectBlockContent,
	BlockContent,
	Enclose,
	BlockType,
	ReadonlyBlockType,
	BlockStoreEvent,
	BlockStoreState,
	ReadonlyBlockStoreState
}