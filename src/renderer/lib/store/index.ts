import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { BlockType } from '$lib/type/block';
import { DraggingStore } from '$lib/type/store';

type Store = {
	contents: Map<string, BlockType>;
	addContent: (content: BlockType) => void;
	removeContent: (id: string) => void;
	updateContent: (id: string, partialContent: Partial<BlockType>) => void;
	clearContents: () => void;
	getBlock: (id: string) => BlockType | undefined;
	getBlocks: () => BlockType[];
	draggingBlock: {
		id: string;
		offset: { x: number; y: number };
	} | null;
	setDraggingBlock: (id: string, offset: { x: number; y: number }) => void;
	clearDraggingBlock: () => void;
};

const useBlocksStore = create<Store>()(
  devtools(
    persist(
      (set, get) => ({
        contents: new Map(),
        addContent: (content) => set((state) => {
          const newContents = new Map(state.contents);
          newContents.set(content.id, content);
          return { contents: newContents };
        }),
        removeContent: (id) => set((state) => {
          const newContents = new Map(state.contents);
          newContents.delete(id);
          return { contents: newContents };
        }),
        updateContent: (id, partialContent) => set((state) => {
          const newContents = new Map(state.contents);
          if (newContents.has(id)) {
            const existingContent = newContents.get(id);
            const updatedContent = { ...existingContent, ...partialContent };
            newContents.set(id, updatedContent as BlockType);
          }
          return { contents: newContents };
        }),
        clearContents: () => set({ contents: new Map() }),
        getBlock: (id: string) => {
          return get().contents.get(id);
        },
        getBlocks: () => {
          return Array.from(get().contents.values());
        },
        draggingBlock: null,
        setDraggingBlock: (id, offset) => set({ draggingBlock: { id, offset } }),
        clearDraggingBlock: () => set({ draggingBlock: null }),
      }),
      {
        ame: 'blocks-store',
      }
    )
  )
);

typeBlockListStore = {
    blocklist: BlockType[];
}

const blockListStore = create<BlockListStore>(() => ({
    blocklist: [],
}))

const draggingStore = create<DraggingStore>(() => ({
    id: '',
  offset: { x: 0, y: 0 }
}))

export { useBlocksStore, blockListStore, draggingStore }