import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

type Store = {
	draggingBlock: {
		id: string;
		offset: { x: number; y: number };
		currentPosition: { x: number; y: number };
	} | null;
	setDraggingBlock: (id: string, offset: { x: number; y: number }, currentPosition: { x: number, y: number }) => void;
	getDraggingBlock: () => {
		id: string;
		offset: { x: number; y: number };
	} | null;
	clearDraggingBlock: () => void;
};

const draggingStore = create<Store>()(
	devtools(
		persist(
			(set, get) => ({
				draggingBlock: null,
				setDraggingBlock: (id: string, offset: { x: number; y: number }, currentPosition: { x: number, y: number }) => {
					if (id && offset) {
						set({ draggingBlock: { id, offset, currentPosition } });
					} else {
						console.error('Invalid id or offset');
					}
				},
				getDraggingBlock: () => {
					return get().draggingBlock;
				},
				clearDraggingBlock: () => set({ draggingBlock: null })
			}),
			{
				name: 'blocks-store'
			}
		)
	)
);

export { draggingStore };
