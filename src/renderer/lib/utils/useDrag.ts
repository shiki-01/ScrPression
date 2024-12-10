export const useDrag = (
	element: HTMLElement,
	e: {
		bounds: 'parent' | 'body';
		position: { x: number; y: number };
		onDrag: (event: PointerEvent) => void;
		onStart: (event: PointerEvent) => void;
		onEnd: (event: PointerEvent) => void;
	}
) => {
	let isDragging: boolean = false;
	let startX: number = 0;
	let startY: number = 0;
	let initialX: number = e.position.x;
	let initialY: number = e.position.y;

	const onMouseDown = (event: PointerEvent) => {
		isDragging = true;
		startX = event.clientX;
		startY = event.clientY;
		element.style.cursor = 'grabbing';
		e.onStart(event);
		window.addEventListener('pointermove', onMouseMove);
		window.addEventListener('pointerup', onMouseUp);
	};

	const onMouseMove = (event: PointerEvent) => {
		if (!isDragging) return;

		const deltaX = event.clientX - startX;
		const deltaY = event.clientY - startY;

		let newX = initialX + deltaX;
		let newY = initialY + deltaY;

		if (e.bounds === 'parent') {
			const parentRect = element.parentElement?.getBoundingClientRect();
			if (!parentRect) return;

			const maxX = parentRect.width - element.offsetWidth;
			const maxY = parentRect.height - element.offsetHeight;
			const minY = 0;

			newX = Math.min(newX, maxX);
			newY = Math.min(Math.max(newY, minY), maxY);
		}

		e.position.x = newX;
		e.position.y = newY;

		element.style.left = `${newX}px`;
		element.style.top = `${newY}px`;
		e.onDrag(event);
	};

	const onMouseUp = (event: PointerEvent) => {
		if (!isDragging) return;
		isDragging = false;
		initialX = e.position.x;
		initialY = e.position.y;
		element.style.cursor = 'grab';
		e.onEnd(event);
		window.removeEventListener('pointermove', onMouseMove);
		window.removeEventListener('pointerup', onMouseUp);
	};

	element.style.cursor = 'grab';
	element.addEventListener('pointerdown', onMouseDown);
};
