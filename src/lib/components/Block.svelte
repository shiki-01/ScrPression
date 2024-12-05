<script lang="ts">
	import { draggable } from '@neodrag/svelte';
	import type { Block, WorkspaceState } from '$lib/types';
	import { workspace, blockspace } from '$lib/stores';
	import { ColorPalette } from '$lib/utils/color';

	export let content: Block;
	export let strict: boolean = false;

	let input: HTMLElement;
	let output: HTMLElement;
	let block: HTMLElement;

	let field: HTMLInputElement;

	let width: number = 1000;
	let height: number = 60;

	$: width = block ? block.clientWidth : 1000;
	$: height = block ? block.clientHeight + 6 : 60;

	let offset = 40;

	const addBlock = () => {
		const newId = Math.random().toString(36).substring(7);
		workspace.update((ws) => {
			let newCon = JSON.parse(JSON.stringify(content));
			newCon.id = newId;
			ws.blocks.set(newId, newCon);
			return ws;
		});
	};

	const overlap = (node: HTMLElement, target: HTMLElement) => {
		const nodeRect = node.getBoundingClientRect();
		const targetRect = target.getBoundingClientRect();
		return !(
			nodeRect.right < targetRect.left ||
			nodeRect.left > targetRect.right ||
			nodeRect.bottom < targetRect.top ||
			nodeRect.top > targetRect.bottom
		);
	};

	const onDrag = (e: { offsetX: number; offsetY: number }) => {
		if (!input || !output || !$blockspace) return;

		workspace.update((ws) => {
			const block = ws.blocks.get(content.id);
			if (block) {
				block.position.x = e.offsetX;
				block.position.y = e.offsetY;
				ws.blocks.set(content.id, block);

				// 子ブロックの位置を更新
				let currentBlock = block;

				while (currentBlock.children) {
					const childBlock = ws.blocks.get(currentBlock.children);
					if (!childBlock) break;

					childBlock.position = {
						x: currentBlock.position.x,
						y: currentBlock.position.y + offset
					};
					ws.blocks.set(childBlock.id, childBlock);

					currentBlock = childBlock;
				}
			}
			return ws;
		});

		handleConnections();
	};

	const findRootBlock = (
		ws: WorkspaceState,
		blockId: string,
		visited: Set<string> = new Set()
	): Block | null => {
		// 既に訪れたブロックなら無限ループを防ぐためにnullを返す
		if (visited.has(blockId)) return null;

		const block = ws.blocks.get(blockId);
		if (!block) return null;

		// 現在のブロックを訪問済みとしてマーク
		visited.add(blockId);

		// ルートブロック（親を持たない）を見つけたら返す
		if (!block.parentId) return block;

		// 親ブロックを再帰的に探索
		return findRootBlock(ws, block.parentId, visited);
	};

	const updateBlockPositions = (ws: WorkspaceState, blockId: string, depth: number = 0) => {
		if (strict) return;
		const block = ws.blocks.get(blockId);
		if (!block) return;

		// 深さに応じてオフセットを調整
		const offsetY = offset + depth * 2;

		if (block.children) {
			const childBlock = ws.blocks.get(block.children);
			if (childBlock) {
				childBlock.position = {
					x: block.position.x,
					y: block.position.y + offsetY
				};
				childBlock.depth = depth + 1;
				ws.blocks.set(block.children, childBlock);

				// 再帰的に子ブロックの位置を更新
				updateBlockPositions(ws, block.children, depth + 1);
			}
		}
	};

	const handleBlockConnection = (ws: WorkspaceState, sourceId: string, targetId: string) => {
		const sourceBlock = ws.blocks.get(sourceId);
		const targetBlock = ws.blocks.get(targetId);

		if (!sourceBlock || !targetBlock) return false;

		// 既に子を持っている場合は新しい接続を受け付けない
		if (sourceBlock.children) {
			return false;
		}

		// 既存の接続を解除
		if (targetBlock.parentId) {
			const oldParent = ws.blocks.get(targetBlock.parentId);
			if (oldParent) {
				oldParent.children = '';
				ws.blocks.set(oldParent.id, oldParent);
			}
		}

		// 新しい接続を作成
		sourceBlock.children = targetId;
		targetBlock.parentId = sourceId;

		// 位置を更新
		targetBlock.position = {
			x: sourceBlock.position.x,
			y: sourceBlock.position.y + offset
		};

		ws.blocks.set(sourceId, sourceBlock);
		ws.blocks.set(targetId, targetBlock);

		return true;
	};

	const handleConnections = () => {
		if (!$blockspace) return;
		workspace.update((ws) => {
			const inputs = $blockspace.querySelectorAll('.input');
			const outputs = $blockspace.querySelectorAll('.output');

			inputs.forEach((inputElement) => {
				outputs.forEach((outputElement) => {
					const targetID = (outputElement as HTMLElement).dataset.id;
					if (!targetID || targetID === content.id) return;

					if (overlap(outputElement as HTMLElement, inputElement as HTMLElement)) {
						handleBlockConnection(ws, targetID, content.id);
					}
				});
			});
			return ws;
		});
	};
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	bind:this={block}
	class:absolute={!strict}
	class="cancel -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2"
	role="button"
	tabindex="0"
	use:draggable={{
		bounds: 'parent',
		disabled: strict,
		position: strict ? { x: 0, y: 0 } : content.position,
		onDrag
	}}
	on:click={() => {
		if (strict) addBlock();
	}}
>
	<div
		class="relative flex h-12 w-fit cursor-pointer rounded-md items-center justify-center align-middle px-2.5 pb-1"
		data-id={content.id}
	>
		{#if content.connections.input}
			<span
				bind:this={input}
				data-id={content.id}
				class:input={!strict}
				class="absolute left-3 top-0 h-1.5 w-6 rounded-b border-2 border-white/0"
			></span>
		{/if}
		{#if content.connections.output}
			<span
				bind:this={output}
				data-id={content.id}
				class:output={!strict}
				class="absolute -bottom-2 left-3 h-2 w-6 rounded-b border-2 border-b-4 border-t-0 border-white/0"
			>
			</span>
		{/if}
		<div class="absolute top-0 left-0 w-full h-0 -z-10">
			<svg class="" width={width + 2} height={height} role="none" xmlns="http://www.w3.org/2000/svg">
				<path
					style="filter: drop-shadow(0 4px 0 {ColorPalette[content.color].border});"
					fill={ColorPalette[content.color].bg}
					stroke={ColorPalette[content.color].border}
					stroke-width="2"
					d="M 4 2 L 14 2 L 14 4 Q 14 8 20 8 L 38 8 Q 42 8 42 4 L 42 2 L {width - 4} 2 Q {width} 2 {width} 4 L {width} {height - 18} Q {width} {height - 14} {width - 4} {height - 14} L 40 {height - 14} L 40 {height - 10} Q 40 {height - 8} 36 {height - 8} L 20 {height - 8} Q 16 {height - 8} 16 {height - 10} L 16 {height - 14} L 4 {height - 14} Q 2 {height - 14} 2 {height - 18} L 2 4 Q 2 2 4 2 Z"
				></path>
			</svg>
		</div>
		<div
			style="color: {ColorPalette[content.color].text};"
			class="w-full h-full flex flex-row items-center justify-center gap-4 align-middle"
		>
			<div class="font-bold whitespace-nowrap">{content.title}</div>
			<div class="flex flex-row gap-2 align-middle">
				{#each content.contents as item}
					{#if item === 'space'}
						<div class="h-5 w-[1px] bg-blue-950"></div>
					{:else}
						<div class="flex flex-row items-center justify-center gap-1.5">
							<div class="whitespace-nowrap">{item.text}</div>
							<input
								type="text"
								style="background-color: {ColorPalette[content.color]
									.text}; border-color: {ColorPalette[content.color].border}; width: calc({Math.max(
									2,
									item.value.length
								)}ch + 0.5rem)"
								class="flex h-6 min-w-[2ch] items-center rounded-full border p-0 text-center align-middle text-sm text-blue-950 focus:outline-none"
								bind:value={item.value}
								bind:this={field}
								on:input={() => {
									if (field) {
										field.style.width = `${Math.max(2, field.value.length)}ch`;
										width = block.clientWidth;
									}
								}}
							/>
						</div>
					{/if}
				{/each}
			</div>
		</div>
	</div>
</div>