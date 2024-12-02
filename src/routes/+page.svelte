<script lang="ts">
    import Icon from "@iconify/svelte";
    import Block from "$lib/components/Block.svelte";
    import type { Block as TBlock } from "$lib/types";

    const content: TBlock = {
		title: 'random',
		type: 'single',
		connect: {
			input: true,
			output: true
		},
		contents: [
			{
				speed: {
					text: 'Speed',
					type: 'number'
				}
			},
			{
				amount: {
					text: 'Amount',
					type: 'number'
				}
			}
		]
	};
</script>

<main class="w-[100svw] h-[100svh] grid grid-cols-[250px_1fr] relative">
    <div class="w-full bg-blue-50 overflow-y-auto p-5 flex flex-col gap-5">
        <Block {content} />
        <Block {content} />
    </div>
    <div class="w-full h-full overflow-hidden">
        <Block {content} />
        <Block {content} />
    </div>
    <button class="absolute bottom-8 right-8 flex flex-row gap-1 items-center justify-center bg-blue-600 text-white shadow-md shadow-blue-600/40 px-4 py-2 rounded-full transition-shadow duration-300 hover:shadow-lg hover:shadow-blue-600/50">
        <p>Output</p>
        <Icon icon="ic:twotone-output" class="w-6 h-6" />
    </button>
</main>