import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import List from '$lib/components/List';
import Block from '$lib/components/BaseBlock';
import ContextMenu from '$lib/components/ContextMenu';
import AddBlock from '$lib/dialog/AddBlock';
import Pointer from '$lib/components/Pointer';
import { draggingStore } from '$lib/store';
import { BlockStore } from '$lib/block/store';
import { ListStore } from '$lib/list/store';
import type { BlockType } from '$lib/block/type';
import { useCanvas } from '$lib/hooks/useCanvas';
import { CanvasStore } from '$lib/canvas/store.ts';
import '@master/css';
import '@master/normal.css';

const App: React.FC = () => {
	const [isAdd, setIsAdd] = useState(false);
	const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
	const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });

	const [pointerPosition, setPointerPosition] = useState({ x: 0, y: 0 });
	const [pointerLeave, setPointerLeave] = useState(true);

	const { draggingBlock } = draggingStore();

	const toggleAdd = () => {
		setIsAdd((prev) => !prev);
	};

	const openContextMenu = (event: React.MouseEvent) => {
		event.preventDefault();
		setContextMenuPosition({ x: event.clientX, y: event.clientY });
		setIsContextMenuOpen(true);
	};

	const main = useRef<HTMLDivElement>(null);
	const canvas = useRef<HTMLDivElement>(null);
	const scrollX = useRef<HTMLDivElement>(null);
	const scrollY = useRef<HTMLDivElement>(null);

	const content: BlockType = {
		id: '',
		title: 'random',
		output: 'wiggle(${x}, ${y});',
		type: 'move',
		contents: [
			{
				id: 'x',
				type: 'value',
				content: {
					title: 'X',
					value: '0',
					placeholder: 'X'
				}
			},
			{
				id: 'y',
				type: 'value',
				content: {
					title: 'Y',
					value: '0',
					placeholder: 'Y'
				}
			}
		],
		connections: {
			input: {
				x: 16,
				y: 0
			},
			output: {
				x: 16,
				y: 0
			}
		},
		position: {
			x: 10,
			y: 10
		},
		size: {
			width: 200,
			height: 58
		},
		childId: '',
		parentId: '',
		depth: 0,
		zIndex: 0
	};

	const content2: BlockType = {
		id: '',
		title: 'null comp',
		output: 'comp("${part}").layer("${null}").transform.${propate};',
		type: 'composition',
		contents: [
			{
				id: 'part',
				type: 'value',
				content: {
					title: 'Part',
					value: '',
					placeholder: 'Part'
				}
			},
			{
				id: 'null',
				type: 'value',
				content: {
					title: 'Null',
					value: '',
					placeholder: 'Null'
				}
			},
			{
				id: 'propate',
				type: 'value',
				content: {
					title: 'Propate',
					value: '',
					placeholder: 'Propate'
				}
			}
		],
		size: {
			width: 200,
			height: 58
		},
		connections: {
			input: {
				x: 16,
				y: 0
			},
			output: {
				x: 16,
				y: 0
			}
		},
		position: {
			x: 10,
			y: 10
		},
		childId: '',
		parentId: '',
		depth: 0,
		zIndex: 0
	};

	const content3: BlockType = {
		id: '',
		title: '干渉',
		output: 'value / length(toComp([0,0]), toComp([0.7071,0.7071])) || 0.001;',
		type: 'works',
		contents: [],
		connections: {
			input: {
				x: 16,
				y: 0
			},
			output: {
				x: 16,
				y: 0
			}
		},
		size: {
			width: 200,
			height: 58
		},
		position: {
			x: 10,
			y: 10
		},
		childId: '',
		parentId: '',
		depth: 0,
		zIndex: 0
	};

	const content4: BlockType = {
		id: '',
		title: 'for loop',
		output: 'for (let i = 0; i < ${count}; i++) {${&&}}',
		type: 'loop',
		contents: [
			{
				id: 'count',
				type: 'value',
				content: {
					title: 'Count',
					value: '0',
					placeholder: 'Count'
				}
			}
		],
		connections: {
			input: {
				x: 16,
				y: 0
			},
			output: {
				x: 16,
				y: 0
			}
		},
		position: {
			x: 10,
			y: 10
		},
		size: {
			width: 200,
			height: 58
		},
		childId: '',
		parentId: '',
		depth: 0,
		zIndex: 0,
		enclose: {
			offset: { x: 16, y: 58 },
			connections: {
				output: { x: 16, y: 0 }
			},
			contents: []
		}
	};

	const content6: BlockType = {
		id: '',
		title: 'if',
		output: 'if (${condition}) {${&&}}',
		type: 'loop',
		contents: [
			{
				id: 'condition',
				type: 'value',
				content: {
					title: 'Condition',
					value: '',
					placeholder: 'Condition'
				}
			}
		],
		connections: {
			input: {
				x: 16,
				y: 0
			},
			output: {
				x: 16,
				y: 0
			}
		},
		position: {
			x: 10,
			y: 10
		},
		size: {
			width: 200,
			height: 58
		},
		childId: '',
		parentId: '',
		depth: 0,
		zIndex: 0,
		enclose: {
			offset: { x: 16, y: 58 },
			connections: {
				output: { x: 16, y: 0 }
			},
			contents: []
		}
	};

	const content5: BlockType = {
		id: '',
		title: 'Start',
		output: '',
		type: 'flag',
		contents: [],
		connections: {
			input: {
				x: 0,
				y: 0
			},
			output: {
				x: 16,
				y: 0
			}
		},
		position: {
			x: 10,
			y: 10
		},
		size: {
			width: 130,
			height: 58
		},
		childId: '',
		parentId: '',
		depth: 0,
		zIndex: 0
	};

	const listContents = useMemo(
		() => [content, content2, content3, content5, content4, content6],
		[]
	);

	const listStore = ListStore.getInstance();

	let isMounted = false;

	useEffect(() => {
		if (isMounted) return;
		listStore.clearList();
		listContents.map((content) => listStore.addList(content));
		isMounted = true;
	}, [listContents]);

	const lists = listStore.getLists();

	const [dragging, setDragging] = useState('');
	const [initialPosition, setInitialPosition] = useState({ x: 0, y: 0 });

	useEffect(() => {
		setDragging(draggingBlock?.id || '');
	}, [draggingBlock]);

	const [idList, setIdList] = useState<string[]>([]);
	const [output, setOutput] = useState('');

	const [width, setWidth] = useState(0);
	const [height, setHeight] = useState(0);
	const [canvasPos, setCanvasPos] = useState({ x: 0, y: 0 });

	const updateCanvasSize = () => {
		const blockStore = BlockStore.getInstance();
		const canvasStore = CanvasStore.getInstance();
		const blocks = blockStore.getBlocks().blocks;
		let minX = Infinity;
		let minY = Infinity;
		let maxX = 0;
		let maxY = 0;

		for (const block of Object.values(blocks)) {
			const x = block.position.x;
			const y = block.position.y;
			const blockMaxX = x + block.size.width;
			const blockMaxY = y + block.size.height;

			if (x < minX) minX = x;
			if (y < minY) minY = y;
			if (blockMaxX > maxX) maxX = blockMaxX;
			if (blockMaxY > maxY) maxY = blockMaxY;
		}

		const margin = 500;
		const offsetX = minX < margin ? margin - minX : 0;
		const offsetY = minY < margin ? margin - minY : 0;

		if (offsetX > 0 || offsetY > 0) {
			for (const block of Object.values(blocks)) {
				block.position.x += offsetX;
				block.position.y += offsetY;
			}
			const canvasPos = canvasStore.getCanvasPos();
			canvasStore.setCanvasPos({ x: canvasPos.x - offsetX, y: canvasPos.y - offsetY });
		}

		setWidth(maxX + margin);
		setHeight(maxY + margin);
		canvasStore.setCanvasSize({ width: maxX + margin, height: maxY + margin });
	};

	useCanvas(canvas.current);

	useEffect(() => {
		const blockStore = BlockStore.getInstance();

		setIdList(blockStore.getBlocks().idList);

		const blockUnsubscribe = blockStore.subscribe((event) => {
			switch (event.type) {
				case 'add':
				case 'remove':
					setIdList(blockStore.getBlocks().idList);
					break;
				case 'clear':
				case 'update':
					break;
				case 'output':
					setOutput(event.output || '');
					break;
			}
		});

		const canvasStore = CanvasStore.getInstance();

		const canvasUnsubscribe = canvasStore.subscribe((event) => {
			switch (event.type) {
				case 'canvas':
					{ const canvasPos = canvasStore.getCanvasPos();
					setCanvasPos(canvasPos);
					break; }
			}
		});

		return () => {
			blockUnsubscribe();
			canvasUnsubscribe();
		};
	}, []);

	return (
		<main
			ref={main}
			className="rel grid h:100svh w:100svw touch-action:none user-select:none grid-template-rows:50px|1fr overflow:hidden"
			onPointerMove={(event) => {
				if (pointerLeave) {
					setPointerLeave(false);
				}
				setPointerPosition({ x: event.clientX, y: event.clientY });
			}}
			onPointerLeave={() => {
				setPointerLeave(true);
			}}
		>
			<Pointer position={pointerPosition} isLeave={pointerLeave} />

			{isContextMenuOpen && (
				<ContextMenu position={contextMenuPosition} onClose={() => setIsContextMenuOpen(false)} />
			)}

			<div
				className={`fixed left:0 top:0 z:50 transition:opacity ${isAdd ? 'opacity:100' : 'opacity:0'}`}
			>
				{isAdd && <AddBlock onClose={toggleAdd} />}
			</div>

			<div className="flex h:full w:full flex:row justify-content:space-between bg:#575f75 px:20px">
				<div className="flex flex:row gap:16px">
					<div className="h:full w:160px">
						<img
							src="https://placehold.jp/200x200"
							alt="logo"
							className="h:full w:full obj:cover"
						/>
					</div>
					<div className="flex flex:row gap:8px py:8px">
						<div>
							<input type="text" className="h:full w:200px px:8px" placeholder="" />
						</div>
						<div className="flex h:full flex:row align-items:center justify-content:center gap:8px f:#f8fafc">
							<button>
								<Icon icon="ic:round-chevron-left" className="h:24px w:24px" />
							</button>
							<button>
								<Icon icon="ic:round-chevron-right" className="h:24px w:24px" />
							</button>
							<button>
								<Icon icon="ic:round-save" className="h:24px w:24px" />
							</button>
						</div>
					</div>
				</div>
				<div className="flex h:full touch:auto flex:row align-items:center justify-content:center gap:16px f:#f8fafc">
					<button
						onClick={() => {
							toggleAdd();
						}}
						className="flex h:full w:full align-items:center justify-content:center"
					>
						<Icon icon="ic:round-add-box" className="h:24px w:24px" />
					</button>
					<button className="flex h:full w:full align-items:center justify-content:center">
						<Icon icon="ic:round-share" className="h:24px w:24px" />
					</button>
					<button className="flex h:full w:full align-items:center justify-content:center">
						<Icon icon="ic:round-settings" className="h:24px w:24px" />
					</button>
				</div>
			</div>
			<div
				onPointerDown={() => {
					setIsContextMenuOpen(false);
				}}
				className="grid grid-template-columns:250|1fr grid-rows:1 overflow:hidden"
			>
				<div className="block-list rel flex h:full w:full user-select:none flex:col align-items:start gap:20px overflow:hidden bg:#e2e8f0 p:20px">
					{lists.map((list, i) => (
						<List key={i} id={list} />
					))}
				</div>
				<div className="grid grid-template-rows:1fr|250px">
					<div className="rel h:full w:full overflow:hidden">
						{dragging !== '' && BlockStore.getInstance().getBlock(dragging)?.id && (
							<Block
								type="drag"
								id={BlockStore.getInstance().getBlock(dragging)?.id || ''}
								initialPosition={initialPosition}
								onEnd={() => {}}
							/>
						)}
						<div
							ref={canvas}
							onClick={() => {
								if (isContextMenuOpen) {
									setIsContextMenuOpen(false);
								}
							}}
							onContextMenu={openContextMenu}
							className="canvas rel cursor:grab bg:#f8fafc cursor:grabbing:active"
							style={{
								width: Math.max(width, 2000) + 'px',
								height: Math.max(height, 2000) + 'px',
								backgroundSize: '20px 20px',
								backgroundImage: 'radial-gradient(#888 10%, transparent 10%)',
								transform: `translate(${canvasPos.x}px, ${canvasPos.y}px)`,
								willChange: 'transform'
							}}
							onPointerDown={(event) => {
								if (event.button === 0) {
									setInitialPosition({ x: event.clientX, y: event.clientY });
								}
							}}
						>
							{idList.map((id) => {
								return dragging !== id && <Block key={id} type="block" id={id} />;
							})}
						</div>
						<div className="trash abs bottom:2 right:2 f:#94a3b8 transition:colors|300 f:#64748b:hover">
							<Icon className="h:40px w:40px" icon="ic:round-delete" />
						</div>
						<div className="abs bottom:0 left:0 h:3 w:full pb:2 pl:2 pr:4">
							<div ref={scrollX} className="h:full w:full rounded bg:#94a3b8"></div>
						</div>
						<div className="abs right:0 top:0 h:full w:12px pb:4 pr:2 pt2">
							<div ref={scrollY} className="h:full w:full rounded bg:#94a3b8"></div>
						</div>
						<div className="abs right:6 top:6 flex flex:col gap:2">
							<button className="flex align-items:center justify-content:center rounded b:2px border-slate-400 bg:#f8fafc f:#94a3b8">
								<Icon icon="ic:round-plus" className="h:24px w:24px" />
							</button>
							<button className="flex align-items:center justify-content:center rounded b:2px border-slate-400 bg:#f8fafc f:#94a3b8">
								<Icon icon="ic:round-minus" className="h:24px w:24px" />
							</button>
						</div>
					</div>
					<div className="h:full w:full overflow:auto bg:#1e293b p:20px f:#f8fafc">
						{output.split('\n').map((line, i) => (
							<p
								style={{
									marginLeft: line.startsWith('\t') ? '1rem' : '0'
								}}
								key={i}
							>
								{line}
							</p>
						))}
					</div>
				</div>
			</div>
		</main>
	);
};

export default App;
