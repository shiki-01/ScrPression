<script lang="ts">
	import Icon from '@iconify/svelte';
	import Block from '$lib/components/Block.svelte';
	import type { Block as TBlock } from '$lib/types';
	import { workspace, blockspace } from '$lib/stores';

	const content: TBlock = {
		id: '',
		title: 'random',
		output: 'wiggle(${x}, ${y})',
		type: 'normal',
		contents: [
			{
				id: 'x',
				text: 'X',
				type: 'value',
				inputType: 'number',
				value: '0'
			},
			{
				id: 'y',
				text: 'Y',
				type: 'value',
				inputType: 'number',
				value: '0'
			}
		],
		connections: {
			input: true,
			output: true
		},
		position: {
			x: 10,
			y: 10
		},
		children: '',
		parentId: '',
		depth: 0
	};

	const content2: TBlock = {
		id: '',
		title: '疑似null',
		output: 'comp("${part}").layer("${null}").transform.${propate}',
		type: 'normal',
		contents: [
			{
				id: 'part',
				text: 'Part',
				type: 'value',
				inputType: 'text',
				value: 'head'
			},
			{
				id: 'null',
				text: 'Null',
				type: 'value',
				inputType: 'text',
				value: 'null'
			},
			{
				id: 'propate',
				text: 'Property',
				type: 'value',
				inputType: 'text',
				value: 'position'
			}
		],
		connections: {
			input: true,
			output: true
		},
		position: {
			x: 10,
			y: 10
		},
		children: '',
		parentId: '',
		depth: 0
	};

	const content3: TBlock = {
		id: '',
		title: '干渉',
		output: 'value / length(toComp([0,0]), toComp([0.7071,0.7071])) || 0.001;',
		type: 'normal',
		contents: [
		],
		connections: {
			input: true,
			output: true
		},
		position: {
			x: 10,
			y: 10
		},
		children: '',
		parentId: '',
		depth: 0
	};

	function formatOutput(block: TBlock) {
        let output = block.output;
        block.contents.forEach(content => {
			if (content === 'space') return;
            const regex = new RegExp(`\\$\\{${content.id}\\}`, 'g');
            output = output.replace(regex, content.value);
        });
        return output;
    }
</script>

<main class="w-[100svw] h-[100svh] grid grid-cols-[250px_1fr] relative">
	<div class="w-full bg-blue-50 overflow-y-auto p-5 flex flex-col gap-5">
		<Block strict={true} {content} />
		<Block strict={true} content={content2} />
		<Block strict={true} content={content3} />
	</div>
	<div class="grid" style="grid-template-rows: 1fr 250px;">
		<div bind:this={$blockspace} class="w-full h-full overflow-hidden relative">
			{#each $workspace.blocks as [_, block]}
				<Block content={block} />
			{/each}
		</div>
		<div class="w-full h-full bg-slate-950 p-5">
			{#each $workspace.blocks as [_, block]}
                <div class="text-white mb-2">
                    <strong>Block ID:</strong> {block.id}<br>
                    <strong>Output:</strong> {formatOutput(block)}
                </div>
            {/each}
		</div>
	</div>
	<button
		class="absolute bottom-8 right-8 flex flex-row gap-1 items-center justify-center bg-blue-600 text-white shadow-md shadow-blue-600/40 px-4 py-2 rounded-full transition-shadow duration-300 hover:shadow-lg hover:shadow-blue-600/50">
		Output
		<Icon icon="ic:twotone-output" class="w-6 h-6" />
	</button>
</main>