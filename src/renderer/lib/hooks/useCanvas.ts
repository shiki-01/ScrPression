import { useEffect, useState } from 'react';
import { draggingStore } from '$lib/store';
import { BlockStore } from '$lib/block/store';

const useCanvas = (node: HTMLDivElement | null) => {
	const [isDragging, setIsDragging] = useState(false);
	const [startPos, setStartPos] = useState({ x: 0, y: 0 });
	const [translate, setTranslate] = useState({ x: 0, y: 0 });
	const { getDraggingBlock } = draggingStore();
	const store = BlockStore.getInstance();
	const [scale, setScale] = useState(1);

	useEffect(() => {
		if (!node) return;

		const onMouseDown = (event: PointerEvent) => {
			if (getDraggingBlock()) return;
			setIsDragging(true);
			setStartPos({ x: event.clientX - translate.x, y: event.clientY - translate.y });
			node.style.cursor = 'grabbing';
		};

		const onMouseMove = (event: PointerEvent) => {
			if (!isDragging) return;
			const newX = event.clientX - startPos.x;
			const newY = event.clientY - startPos.y;

			const maxX = (node.clientWidth * scale) / 2;
			const maxY = (node.clientHeight * scale) / 2;

			const boundedX = Math.max(-maxX, Math.min(newX, 0));
			const boundedY = Math.max(-maxY, Math.min(newY, 0));

			setTranslate({ x: boundedX, y: boundedY });
			store.setCanvasPos({ x: boundedX, y: boundedY });
		};

		const onMouseUp = () => {
			setIsDragging(false);
			node.style.cursor = 'grab';
		};

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
};

export { useCanvas };
