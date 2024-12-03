<script lang="ts">
 import { draggable } from '@neodrag/svelte';
 import type { Block, WorkspaceState } from '$lib/types';
 import { workspace, blockspace } from '$lib/stores';

 export let content: Block;
 export let strict: boolean = false;

 let input: HTMLElement;
 let output: HTMLElement;

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

	role="button"
	tabindex="0"
	use:draggable={{
		bounds: 'parent',
		disabled: strict,
		position: content.position,
		onDrag
	}}
	on:click={() => {
		if (strict) addBlock();
	}}
>
	<div
		class="clip-path relative flex h-10 w-fit cursor-pointer rounded-md bg-blue-400 border-2 border-blue-600 px-2.5 py-2"
		data-id={content.id}
	>
		{#if content.connections.input}
			<span
				bind:this={input}
				data-id={content.id}
				class:input={!strict}
				class="absolute left-3 top-0 h-1 w-6 bg-none border-2 border-blue-600"
			></span>
		{/if}
		{#if content.connections.output}
			<span
				bind:this={output}
				data-id={content.id}
				class:output={!strict}
				class="absolute -bottom-1.5 left-3 h-1.5 w-6 bg-blue-400 border-2 border-t-0 border-blue-600"
			></span>
		{/if}
		<div class="flex flex-row items-center justify-center gap-4 align-middle">
			<div class="font-bold text-blue-950">{content.title}</div>
			<div class="flex flex-row gap-2 align-middle">
				{#each content.contents as item}
					{#if item === 'space'}
						<div class="h-5 w-[1px] bg-blue-950"></div>
					{:else}
						<div class="flex flex-row items-center justify-center gap-1">
							<div>{item.text}</div>
							<input
								type={item.type}
								class="h-5 w-10 overflow-x-auto rounded-full border-2 border-blue-600 bg-blue-200 p-0 pl-2 text-sm text-blue-950 focus:outline-none"
								bind:value={item.value}
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
   100% calc(100% + 0.25rem),
   0 calc(100% + 0.25rem)
  );
 }
</style>