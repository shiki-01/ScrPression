interface ConnectionPoint {
  input: boolean;
  output: boolean;
}

interface BlockContent {
  type: 'normal' | 'container' | 'value';
  text: string;
  inputType?: string;
  value?: string;
}

interface Block {
  id: string;
  type: 'normal' | 'container' | 'value';
  title: string;
  contents: (BlockContent | 'space')[];
  position: { x: number; y: number };
  connections: ConnectionPoint;
  children: string[];
  parentId: string;
}

interface WorkspaceState {
  blocks: Map<string, Block>;
}

export type { BlockContent, Block, ConnectionPoint, WorkspaceState };