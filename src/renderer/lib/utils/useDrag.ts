import { useEffect, useRef, useState } from 'react';
import { useBlocksStore } from '$lib/store';
import { BlockType } from '$lib/type/block';

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
  const startX = useRef(0);
  const startY = useRef(0);
  const initialX = useRef(params.position.x);
  const initialY = useRef(params.position.y);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const onMouseDown = (event: PointerEvent) => {
      setIsDragging(true);
      startX.current = event.clientX;
      startY.current = event.clientY;
      element.style.cursor = 'grabbing';
      params.onStart(event);
      console.log('Dragging:', params.content.id);

      initialX.current = params.position.x;
      initialY.current = params.position.y;

      window.addEventListener('pointermove', onMouseMove);
      window.addEventListener('pointerup', onMouseUp);
    };

    const onMouseMove = (event: PointerEvent) => {
      if (!isDragging) return;
      const deltaX = event.clientX - startX.current;
      const deltaY = event.clientY - startY.current;
      let newX = initialX.current + deltaX;
      let newY = initialY.current + deltaY;
      if (params.bounds === 'parent') {
        const parentRect = element.parentElement?.getBoundingClientRect();
        if (parentRect) {
          newX = Math.max(0, Math.min(parentRect.width - element.offsetWidth, newX));
          newY = Math.max(0, Math.min(parentRect.height - element.offsetHeight, newY));
        }
      }

      console.log('newX:', newX, 'newY:', newY);
      useBlocksStore.getState().updateContent(params.content.id, {
        position: { x: newX, y: newY }
      });

      params.onDrag(event);
    };

    const onMouseUp = (event: PointerEvent) => {
      if (!isDragging) return;
      setIsDragging(false);
      element.style.cursor = 'grab';
      params.onEnd(event);
      console.log('Dropped:', params.content.id);
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