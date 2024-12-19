import { useEffect, useState } from 'react';
import { useBlocksStore } from '$lib/store';
import { BlockStore } from '$lib/block/store';

const useCanvas = (node: HTMLDivElement | null) => {
	const [isDragging, setIsDragging] = useState(false);
	const [startPos, setStartPos] = useState({ x: 0, y: 0 });
	const [translate, setTranslate] = useState({ x: 0, y: 0 });
	const { getDraggingBlock } = useBlocksStore();
	const store = BlockStore.getInstance();

	useEffect(() => {
		if (!node) return;
		const onMouseDown = (event: PointerEvent) => {
			if (getDraggingBlock()) return;
			setIsDragging(true);
			setStartPos({ x: event.clientX - translate.x, y: event.clientY - translate.y });
			node.style.cursor = 'grabbing';
		}

		const onMouseMove = (event: PointerEvent) => {
			if (!isDragging) return;
			setTranslate({
				x: event.clientX - startPos.x,
				y: event.clientY - startPos.y
			});
			store.setCanvasPos({ x: translate.x, y: translate.y });
			node.style.transform = `translate(${translate.x}px, ${translate.y}px)`;
		}

		const onMouseUp = (event: PointerEvent) => {
			setIsDragging(false);
			node.style.cursor = 'grab';
		}

		node.style.cursor = 'grab';

		node.addEventListener('pointerdown', onMouseDown);
		window.addEventListener('pointermove', onMouseMove);
		window.addEventListener('pointerup', onMouseUp);

		return () => {
			node.removeEventListener('pointerdown', onMouseDown);
			window.removeEventListener('pointermove', onMouseMove);
			window.removeEventListener('pointerup', onMouseUp);
		};
	}, [node, isDragging, translate]);

	return {};
}

export { useCanvas };