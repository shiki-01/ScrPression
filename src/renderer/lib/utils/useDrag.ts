import { BlockStore } from '$lib/block/store';
import type { BlockType } from '$lib/block/type';

export const useDrag = (
 element: HTMLElement,
 params: {
  bounds: 'parent' | 'body';
  position: { x: number; y: number };
  content: BlockType;
  onDrag: (event: PointerEvent) => void;
  onStart: (event: PointerEvent) => void;
  onEnd: (event: PointerEvent) => void;
  initialDrag: boolean;
 }
) => {
 const blockStore = BlockStore.getInstance();

 let isDragging = params.initialDrag || false;
 let startX = 0;
 let startY = 0;
 let block = blockStore.getBlock(params.content.id) as BlockType;

 if (!block) return;

 let initialX = block.position.x;
 let initialY = block.position.y;

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

  block = blockStore.getBlock(params.content.id) as BlockType;
  initialX = block.position.x;
  initialY = block.position.y;

  window.addEventListener('pointermove', onMouseMove);
  window.addEventListener('pointerup', onMouseUp);
 };

 const onMouseMove = (event: PointerEvent) => {
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

  blockStore.updateBlock(params.content.id, { position: { x: newX, y: newY } });

  params.onDrag(event);
 };

 const onMouseUp = (event: PointerEvent) => {
  if (!isDragging) return;

  isDragging = false;
  initialX = block.position.x;
  initialY = block.position.y;
  element.style.cursor = 'grab';
  params.onEnd(event);
  cleanup();
 };

 element.style.cursor = 'grab';
 element.addEventListener('pointerdown', onMouseDown);

 if (params.initialDrag) {
  onMouseDown(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, view: window }));
  initialX = block.position.x;
  initialY = block.position.y;
 }

 return {
  destroy() {
   element.removeEventListener('pointerdown', onMouseDown);
   cleanup();
  }
 };
};