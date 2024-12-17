import { Icon } from '@iconify/react';
import { BlockType } from '$lib/type/block';
import { draggingStore, useBlocksStore } from '$lib/store';
import React, { useEffect, useRef, useState } from 'react';
import { DraggingStore } from '$lib/type/store';
import { getColor, ColorPalette } from '$lib/utils/color';
import useDrag from '$lib/utils/useDrag';

interface BlockProps {
  content: BlockType;
}

const Block: React.FC<BlockProps> = ({ content }) => {
  const [isDragging, setIsDragging] = useState(draggingStore.getState().id === content.id);

  const [width, setWidth] = useState(200);
  const [height, setHeight] = useState(58);
  const [isFlag, setIsFlag] = useState(false);

  const blockRef = useRef<HTMLDivElement>(null);

  const [position, setPosition] = useState({ x: content.position.x, y: content.position.y });
  const updateContent = useBlocksStore((state) => state.updateContent);
  const getBlock = useBlocksStore((state) => state.getBlock);

  useDrag(blockRef, {
    bounds: 'parent',
    position,
    content,
    onDrag: () => {},
    onStart: () => {
      draggingStore.setState({ id: content.id });
    },
    onEnd: () => {
      draggingStore.setState({ id: '' });
    },
  });


  useEffect(() => {
    const block = getBlock(content.id);
    if (block) {
      setPosition(block.position);
    }
  }, [getBlock, content.id]);

  useEffect(() => {
    updateContent(content.id, { position });
  }, [position, content.id, updateContent]);

  useEffect(() => {
    const unsubscribe = draggingStore.subscribe(
      (state: DraggingStore) => {
        setIsDragging(state.id === content.id);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [content.id]);

  useEffect(() => {
    setIsFlag(content.type === 'flag');
  }, [content.type]);

  const updateSize = () => {
    if (blockRef.current) {
      setWidth(blockRef.current.offsetWidth);
      setHeight(blockRef.current.offsetHeight + 8);
    }
  };

  useEffect(() => {
    updateSize();
  }, []);

  useEffect(() => {
    if (!isDragging) {
      updateSize();
    }
  }, [isDragging]);

  if (isDragging || !content) {
    return null;
  }

  return (
    <div
      ref={blockRef}
      className='cancel absolute'
      style={{ zIndex: content.zIndex, left: position.x, top: position.y }}
    >
      <div
        className='relative flex h-12 w-fit cursor-pointer items-center justify-center rounded-md px-2.5 pb-1 align-middle'
        data-id={content.id}
      >
        {content.connections.input && (
          <span
            data-id={content.id}
            className="input absolute h-2 w-6"
            style={{
              left: content.connections.input.x,
              top: content.connections.input.y,
            }}
          ></span>
        )}
        {content.connections.output && (
          <span
            data-id={content.id}
            className="output absolute h-2 w-6"
            style={{
              bottom: content.connections.output.x,
              top: content.connections.output.y,
            }}
          ></span>
        )}
        <div className="absolute left-0 top-0 -z-10 h-0 w-full">
          <svg className="" height={height} role="none" width={width + 2} xmlns="http://www.w3.org/2000/svg">
            <path
              d={isFlag
                ? `M 14 2 L 42 2 L ${width - 14} 2 Q ${width} 2 ${width} 14 L ${width} ${height - 18} Q ${width} ${height - 14} ${width - 4} ${height - 14} L 40 ${height - 14} L 40 ${height - 10} Q 40 ${height - 8} 36 ${height - 8} L 20 ${height - 8} Q 16 ${height - 8} 16 ${height - 10} L 16 ${height - 14} L 4 ${height - 14} Q 2 ${height - 14} 2 ${height - 18} L 2 14 Q 2 2 14 2 Z`
                : `M 4 2 L 14 2 L 14 4 Q 14 8 20 8 L 38 8 Q 42 8 42 4 L 42 2 L ${width - 4} 2 Q ${width} 2 ${width} 4 L ${width} ${height - 18} Q ${width} ${height - 14} ${width - 4} ${height - 14} L 40 ${height - 14} L 40 ${height - 10} Q 40 ${height - 8} 36 ${height - 8} L 20 ${height - 8} Q 16 ${height - 8} 16 ${height - 10} L 16 ${height - 14} L 4 ${height - 14} Q 2 ${height - 14} 2 ${height - 18} L 2 4 Q 2 2 4 2 Z`}
              fill={ColorPalette[getColor(content.type)].bg}
              stroke={ColorPalette[getColor(content.type)].border}
              strokeWidth="2"
              style={{ filter: `drop-shadow(0 4px 0 ${ColorPalette[getColor(content.type)].border})` }}
            ></path>
          </svg>
        </div>
        <div
          className="flex h-full w-full flex-row items-center justify-center gap-4 align-middle"
          style={{ color: ColorPalette[getColor(content.type)].text }}
        >
          <div className="whitespace-nowrap font-bold">{content.title}</div>
          <div className="flex flex-row gap-2 align-middle">
            {content.contents.map((item, index) => (
              <React.Fragment key={index}>
                {item.type === 'separator' ? (
                  <div className="h-5 w-[1px] bg-blue-950"></div>
                ) : (
                  <div className="flex flex-row items-center justify-center gap-1.5">
                    <div className="whitespace-nowrap">{item.content.title}</div>
                    <div
                      className="flex items-center justify-center rounded-full border-2 px-2 focus:outline-none"
                      style={{
                        backgroundColor: ColorPalette[getColor(content.type)].text,
                        borderColor: ColorPalette[getColor(content.type)].border,
                      }}
                    >
                      <input
                        type="text"
                        className="text-slate-900 bg-transparent"
                        style={{ width: `${item.content.value.length + 1}ch` }}
                        onChange={(e) => {
                          e.target.style.width = `${e.target.value.length + 1}ch`;
                          setWidth(blockRef.current!.offsetWidth);
                        }}
                      />
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
          {isFlag && (
            <button
              className="flex items-center justify-center rounded-full border-2 p-1"
              style={{
                backgroundColor: ColorPalette[getColor(content.type)].text,
                borderColor: ColorPalette[getColor(content.type)].border,
              }}
            >
              <Icon icon="ic:round-flag" className="h-5 w-5 text-green-400" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Block;