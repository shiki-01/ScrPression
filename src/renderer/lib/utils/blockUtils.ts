import { BlockType } from '$lib/block/type';
import { BlockStore } from '$lib/block/store';

export const findAllChildren = (store: BlockStore, id: string): BlockType[] => {
	return store.getBlocks().idList.reduce((acc, blockId) => {
		const block = store.getBlock(blockId);
		if (block?.parentId === id) {
			return [...acc, block, ...findAllChildren(store, block.id)];
		}
		return acc;
	}, [] as BlockType[]);
};

export const formatBlockOutput = (blocks: BlockType[]): string => {
	return blocks
		.filter((block) => block.type !== 'flag')
		.map((block) => {
			let output = block.output;
			block.contents.forEach((content) => {
				if (content.type === 'value') {
					output = output.replace(new RegExp(`\\$\\{${content.id}\\}`, 'g'), content.content.value);
				}
			});
			return output;
		})
		.join('\n')
		.trim();
};
