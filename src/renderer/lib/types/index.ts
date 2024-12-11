interface ConnectionPoint {
	input: boolean;
	output: boolean;
}

interface BlockContent {
	id: string;
	type: 'normal' | 'container' | 'value';
	text: string;
	inputType: string;
	value: string;
}

interface Block {
	id: string;
	type: 'normal' | 'container' | 'value' | 'flag';
	color: 'blue' | 'red' | 'green' | 'yellow' | 'orange' | 'cyan';
	title: string;
	output: string;
	contents: (BlockContent | 'space')[];
	position: { x: number; y: number };
	connections: ConnectionPoint;
	children: string;
	parentId: string;
	depth: number;
	zIndex: number;
}

interface HistoryState {
	blocks: Map<string, Block>;
	positions: Map<string, { x: number; y: number }>;
}

interface WorkspaceState {
	positions: Map<string, { x: number; y: number }>;
	title: string;
	blocks: Map<string, Block>;
	history: HistoryState[];
	currentIndex: number;
}

interface WorkspaceStore {
	initialize(workspace: WorkspaceState): void;
	addBlock(block: Block): void;
	updateBlock(id: string, updates: Partial<Block>): void;
	get(): WorkspaceState;
	update(param: (state: WorkspaceState) => WorkspaceState): void;
	set(param: {
		positions: Map<string, { x: number; y: number }>;
		title: string;
		blocks: Map<string, Block>;
		history: HistoryState[];
		currentIndex: number;
	}): void;
}

export type { BlockContent, Block, ConnectionPoint, HistoryState, WorkspaceState, WorkspaceStore };