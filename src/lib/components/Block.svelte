<script lang="ts">
	import { draggable } from '@neodrag/svelte';
	import type { Block, WorkspaceState } from '$lib/types';
	import { workspace, blockspace } from '$lib/stores';
	import { ColorPalette } from '$lib/utils/color';

	export let content: Block;
	export let strict: boolean = false;

	let input: HTMLElement;
	let output: HTMLElement;

	let field: HTMLInputElement;

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
				let offset = 38.5;

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

	const findRootBlock = (ws: WorkspaceState, blockId: string, visited: Set<string> = new Set()): Block | null => {
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
		const offsetY = 38.5 + (depth * 2);

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
			y: sourceBlock.position.y + 38.5
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
	class:absolute={!strict}
	class="cancel"
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
		style="background-color: {ColorPalette[content.color].bg}; border-color: {ColorPalette[content.color].border}; color: {ColorPalette[content.color].text}"
		class="clip-path relative flex h-10 w-fit cursor-pointer rounded-md border-2 border-b-4 px-2.5 py-2"
		data-id={content.id}
	>
		{#if content.connections.input}
			<span
				bind:this={input}
				data-id={content.id}
				style="background-color: {ColorPalette[content.color].bg}; border-color: {ColorPalette[content.color].border}"
				class:input={!strict}
				class="absolute left-3 top-0 h-1 w-6 bg-none border-2"
			></span>
		{/if}
		{#if content.connections.output}
			<span
				bind:this={output}
				data-id={content.id}
				style="background-color: {ColorPalette[content.color].bg}; border-color: {ColorPalette[content.color].border}"
				class:output={!strict}
				class="absolute -bottom-2 left-3 h-2 w-6 border-2 border-b-4 border-t-0 rounded-b-[0.25rem]"
			></span>
		{/if}
		<div class="flex flex-row items-center justify-center gap-4 align-middle">
			<div class="font-bold">{content.title}</div>
			<div class="flex flex-row gap-2 align-middle">
				{#each content.contents as item}
					{#if item === 'space'}
						<div class="h-5 w-[1px] bg-blue-950"></div>
					{:else}
						<div class="flex flex-row items-center justify-center gap-1.5">
							<div>{item.text}</div>
							<input
								type="text"
								style="background-color: {ColorPalette[content.color].text}; border-color: {ColorPalette[content.color].border}; width: calc({Math.max(2, item.value.length)}ch + 0.5rem)"
								class="h-6 min-w-[2ch] rounded-full border p-0 text-sm text-blue-950 flex text-center items-center align-middle focus:outline-none"
								bind:value={item.value}
								bind:this={field}
								on:input={() => {
									if (field) {
										field.style.width = `${Math.max(2, field.value.length)}ch`;
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

<style>
    .clip-path {
        clip-path: polygon(
                0 0,
                1rem 0,
                1rem 0.25rem,
                calc(1rem + 1.25rem) 0.25rem,
                calc(1rem + 1.25rem) 0,
                100% 0,
                100% calc(100% + 0.5rem),
                0 calc(100% + 0.5rem)
        );
    }
</style>