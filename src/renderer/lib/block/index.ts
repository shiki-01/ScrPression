import type { BlockType } from '$lib/block/type.ts';

// ブロックのデフォルト値
const defaultBlock: BlockType = {
	id: '',
	type: 'works',
	title: '',
	output: '',
	connections: {
		input: { x: 0, y: 0 },
		output: { x: 0, y: 0 }
	},
	contents: [],
	position: { x: 0, y: 0 },
	size: { width: 0, height: 0 },
	depth: 0,
	zIndex: 0
}

export { defaultBlock };