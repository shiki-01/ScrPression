import { workspace } from "$lib/stores";
import type { Block } from "$lib/types";

export const useDrag = (
  element: HTMLElement,
  params: {
    bounds: 'parent' | 'body';
    position: { x: number; y: number };
    content: Block;
    onDrag: (event: PointerEvent) => void;
    onStart: (event: PointerEvent) => void;
    onEnd: (event: PointerEvent) => void;
  }
) => {
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let initialX = params.content.position.x;
  let initialY = params.content.position.y;
  let block = params.content

  const cleanup = () => {
    window.removeEventListener('pointermove', onMouseMove);
    window.removeEventListener('pointerup', onMouseUp);
  };

  const onMouseDown = (event: PointerEvent) => {
    isDragging = true;
    startX = event.clientX;
    startY = event.clientY;
    element.style.cursor = 'grabbing';
    params.onStart(event);

    window.addEventListener('pointermove', onMouseMove);
    window.addEventListener('pointerup', onMouseUp);
  };

  const onMouseMove = (event: PointerEvent) => {
    workspace.subscribe((ws) => {
      block = ws.blocks.get(block.id) || block;
    })
    if (!isDragging) return;

    event.preventDefault();
    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;

    let newX = initialX + deltaX;
    let newY = initialY + deltaY;

    if (params.bounds === 'parent') {
      const parentRect = element.parentElement?.getBoundingClientRect();
      if (parentRect) {
        const maxX = parentRect.width - element.offsetWidth;
        const maxY = parentRect.height - element.offsetHeight;
        newX = Math.min(newX, maxX);
        newY = Math.max(0, Math.min(newY, maxY));
      }
    }

    params.position.x = newX;
    params.position.y = newY;
    block.position.x = newX;
    block.position.y = newY;
    params.onDrag(event);
  };

  const onMouseUp = (event: PointerEvent) => {
    if (!isDragging) return;

    isDragging = false;
    initialX = params.position.x;
    initialY = params.position.y;
    element.style.cursor = 'grab';
    params.onEnd(event);
    cleanup();
  };

  element.style.cursor = 'grab';
  element.addEventListener('pointerdown', onMouseDown);

  return {
    destroy() {
      element.removeEventListener('pointerdown', onMouseDown);
      cleanup();
    }
  };
};