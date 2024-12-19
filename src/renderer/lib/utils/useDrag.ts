import React, { useEffect, useRef, useState } from 'react';
import { BlockStore } from '$lib/block/store';
import { BlockType } from '$lib/block/type';

const useDrag = (
	ref: React.RefObject<HTMLDivElement | null>,
	params: {
		bounds: 'parent' | 'body';
		position: { x: number; y: number };
		content: BlockType;
		onDrag: (event: PointerEvent) => void;
		onStart: (event: PointerEvent) => void;
		onEnd: (event: PointerEvent) => void;
	}
) => {
	const [isDragging, setIsDragging] = useState(false);
	const startPos = useRef({ x: 0, y: 0 });
	const offset = useRef({ x: 0, y: 0 });

	useEffect(() => {
		const element = ref.current;
		if (!element) return;

		const onMouseDown = (event: PointerEvent) => {
			setIsDragging(true);
			startPos.current = { x: event.clientX, y: event.clientY };
			offset.current = {
				x: event.clientX - element.getBoundingClientRect().left,
				y: event.clientY - element.getBoundingClientRect().top
			};
			element.style.cursor = 'grabbing';
			params.onStart(event);
		};

		const onMouseMove = (event: PointerEvent) => {
			if (!isDragging) return;
			const newX = event.clientX - offset.current.x;
			const newY = event.clientY - offset.current.y;

			BlockStore.getInstance().updateBlock(params.content.id, { position: { x: newX, y: newY } });
			params.onDrag(event);
		};

		const onMouseUp = (event: PointerEvent) => {
			if (!isDragging) return;
			setIsDragging(false);
			element.style.cursor = 'grab';
			params.onEnd(event);
			window.removeEventListener('pointermove', onMouseMove);
			window.removeEventListener('pointerup', onMouseUp);
		};

		element.style.cursor = 'grab';
		element.addEventListener('pointerdown', onMouseDown);

		return () => {
			element.removeEventListener('pointerdown', onMouseDown);
			window.removeEventListener('pointermove', onMouseMove);
			window.removeEventListener('pointerup', onMouseUp);
		};
	}, [ref, params, isDragging]);

	return {};
};

export default useDrag;