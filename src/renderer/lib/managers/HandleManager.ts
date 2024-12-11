import type { Block, WorkspaceStore } from '$lib/types';
import { workspace } from '$lib/stores/workspace';

export class HandleManager {
	static block: Block;

	static handlePointer(event: PointerEvent, block: Block) {
		let isDragging = true;
		let startX = event.clientX;
		let startY = event.clientY;
		let initialX = block.position.x;
		let initialY = block.position.y;

		const onMouseDown = (event: PointerEvent) => {
			isDragging = true;
			startX = event.clientX;
			startY = event.clientY;
			(event.target as HTMLElement).style.cursor = 'grabbing';
			HandleManager.onStart(event);
			window.addEventListener('pointermove', onMouseMove);
			window.addEventListener('pointerup', onMouseUp);
		}

		const onMouseMove = (event: PointerEvent) => {
			if (!isDragging) return;

			event.preventDefault();
			const deltaX = event.clientX - startX;
			const deltaY = event.clientY - startY;

			let newX = initialX + deltaX;
			let newY = initialY + deltaY;

			if (block.connections.input) {
				const parentRect = (event.target as HTMLElement)?.parentElement?.getBoundingClientRect();
				if (parentRect) {
					const maxX = parentRect.width - (event.target as HTMLElement)?.offsetWidth;
					const maxY = parentRect.height - (event.target as HTMLElement)?.offsetHeight;
					newX = Math.min(newX, maxX);
					newY = Math.max(0, Math.min(newY, maxY));
				}
			}

			block.position.x = newX;
			block.position.y = newY;

			HandleManager.onDrag(event);
		};

		const onMouseUp = (event: PointerEvent) => {
			isDragging = false;
			(event.target as HTMLElement).style.cursor = 'grab';
			HandleManager.onEnd(event);
			cleanup();
		};

		const cleanup = () => {
			window.removeEventListener('pointermove', onMouseMove);
			window.removeEventListener('pointerup', onMouseUp);
		};

		window.addEventListener('pointerdown', onMouseDown);
	}

	private static onDrag(event: PointerEvent) {
		workspace.update((ws) => {
			const block = ws.blocks.get(this.block.id as string);
			if (!block) return ws;

			return {
				...ws,
				blocks: new Map(ws.blocks).set(block.id, block)
			};
		});
	}

	private static onStart(event: PointerEvent) {
		workspace.update((ws) => {
			const block = ws.blocks.get(this.block.id as string);
			if (!block) return ws;

			return {
				...ws,
				blocks: new Map(ws.blocks).set(block.id, block)
			};
		});
	}

	static onEnd(event: PointerEvent) {
		workspace.update((ws) => {
			const block = ws.blocks.get(this.block.id as string);
			if (!block) return ws;

			return {
				...ws,
				blocks: new Map(ws.blocks).set(block.id, block)
			};
		});
	}
}