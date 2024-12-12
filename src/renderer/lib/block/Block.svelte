<script lang="ts">
    import { ColorPalette } from '$lib/utils/color';
    import { getColor } from '$lib/block/index';
    import { toast } from 'svelte-sonner';
    import Icon from '@iconify/svelte';
    import type { BlockType } from '$lib/block/type';
    import { BlockStore } from '$lib/block/store';
    import { EventManager } from '$lib/managers/EventManager';
    import { onMount } from 'svelte';
    import { blockspace } from '$lib/stores';

    export let id: string;

    const blockStore = BlockStore.getInstance();

    $: content = blockStore.getBlock(id) as BlockType;
    $: isFlag = content.type === 'flag';
    $: width = block ? block.clientWidth + 6 : 1000;
    $: height = block ? block.clientHeight + 6 : 60;

    let block: HTMLElement;
    let field: HTMLInputElement;

    let isDragging = false;
    let timeOut = false;

    onMount(() => {
        if (block) {
            width = block.clientWidth + 6;
            height = block.clientHeight + 6;
        }
    });

    let startX = 0;
    let startY = 0;
    let initialX = 0;
    let initialY = 0;
    if (content) {
        initialX = content.position.x || 0;
        initialY = content.position.y || 0;
    }

    const handleConnection = () => {
        const source = blockStore.getBlock(content.id);

        if (!source || source.parentId !== '' || timeOut) return;

        let space: HTMLElement | null = null;
        blockspace.subscribe((blockspace) => {
            space = blockspace;
        });

        if (!space) return;

        const inputs = (space as HTMLElement).querySelectorAll('.input');
        const outputs = (space as HTMLElement).querySelectorAll('.output');

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

        inputs.forEach((input) => {
            outputs.forEach((output) => {
                if (overlap(input as HTMLElement, output as HTMLElement)) {
                    const source = blockStore.getBlock(content.id);

                    if (source && source.childId === '') {
                        const target = blockStore.getBlock((output as HTMLElement).dataset.id || '');

                        if (target && target.parentId === '') {
                            source.parentId = target.id;
                            target.childId = source.id;

                            blockStore.updateBlock(source.id, source);
                            blockStore.updateBlock(target.id, target);
                        }
                    }
                }
            });
        });
    };

    const onPointerMove = (event: PointerEvent) => {
        if (!isDragging) return;

        event.preventDefault();
        const deltaX = event.clientX - startX;
        const deltaY = event.clientY - startY;

        let newX = initialX + deltaX;
        let newY = initialY + deltaY;

        const parentRect = block?.parentElement?.getBoundingClientRect();
        if (parentRect) {
            const maxX = parentRect.width - block.offsetWidth;
            const maxY = parentRect.height - block.offsetHeight;
            newX = Math.min(newX, maxX);
            newY = Math.max(0, Math.min(newY, maxY));
        }

        if (content) {
            content.position.x = newX;
            content.position.y = newY;
            blockStore.updateBlock(content.id, content);
        }

        EventManager.emit('block:drag', { event });

        let offset = 40;

        const updateBlockPositions = (blockId: string) => {
            const block = blockStore.getBlock(blockId);
            if (!block) return;

            const updateChildrenPositions = (parentId: string, depth: number = 0) => {
                const parent = blockStore.getBlock(parentId);
                if (!parent?.childId) return;

                const child = blockStore.getBlock(parent.childId);
                if (!child) return;

                child.position = {
                    x: parent.position.x,
                    y: parent.position.y + 40 * (depth + 1)
                };
                child.depth = depth + 1;

                blockStore.updateBlock(child.id, child);
                updateChildrenPositions(child.id, depth + 1);
            };

            updateChildrenPositions(blockId);
        };

        handleConnection();
        updateBlockPositions(content.id);
    };

    const onPointerUp = (event: PointerEvent) => {
        isDragging = false;
        timeOut = false;
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        EventManager.emit('block:dragEnd', { event });
    };

    EventManager.on(`block:dragStart:${id}`, ({ event }: { event: PointerEvent }) => {
        if (isDragging || !content) return;

        isDragging = true;
        startX = event.clientX;
        startY = event.clientY;
        initialX = content?.position.x || 0;
        initialY = content?.position.y || 0;

        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
    });
</script>

<div
    bind:this={block}
    class="cancel absolute"
    role="button"
    style="z-index: {content.zIndex}; top: {content.position.y}px; left: {content.position.x}px;"
    tabindex="0"
    on:pointerdown={(e) => {
        const source = blockStore.getBlock(content.id);
        console.log(source);

        if (source && source.parentId !== '') {
            timeOut = true;
            const parent = blockStore.getBlock(source.parentId);

            if (parent) {
                parent.childId = '';
                blockStore.updateBlock(parent.id, parent);
            }

            blockStore.updateBlock(content.id, { ...content, parentId: '' });
        }
        EventManager.emit(`block:dragStart:${id}`, { event: e });
    }}
>
    <div
        class="relative flex h-12 w-fit cursor-pointer items-center justify-center rounded-md px-2.5 pb-1 align-middle"
        data-id={content.id}
    >
        {#if content.connections.input}
            <span
                data-id={content.id}
                class="input absolute h-2 w-6"
                style="top: {content.connections.input.y}px; left: {content.connections.input.x}px;"
            ></span>
        {/if}
        {#if content.connections.output}
            <span
                data-id={content.id}
                class="output absolute h-2 w-6"
                style="bottom: {content.connections.output.y}px; left: {content.connections.output.x}px;"
            ></span>
        {/if}
        <div class="absolute left-0 top-0 -z-10 h-0 w-full">
            <svg class="" {height} role="none" width={width + 2} xmlns="http://www.w3.org/2000/svg">
                <path
                    d={isFlag
                        ? `M 14 2 L 42 2 L ${width - 14} 2 Q ${width} 2 ${width} 14 L ${width} ${height - 18} Q ${width} ${height - 14} ${width - 4} ${height - 14} L 40 ${height - 14} L 40 ${height - 10} Q 40 ${height - 8} 36 ${height - 8} L 20 ${height - 8} Q 16 ${height - 8} 16 ${height - 10} L 16 ${height - 14} L 4 ${height - 14} Q 2 ${height - 14} 2 ${height - 18} L 2 14 Q 2 2 14 2 Z`
                        : `M 4 2 L 14 2 L 14 4 Q 14 8 20 8 L 38 8 Q 42 8 42 4 L 42 2 L ${width - 4} 2 Q ${width} 2 ${width} 4 L ${width} ${height - 18} Q ${width} ${height - 14} ${width - 4} ${height - 14} L 40 ${height - 14} L 40 ${height - 10} Q 40 ${height - 8} 36 ${height - 8} L 20 ${height - 8} Q 16 ${height - 8} 16 ${height - 10} L 16 ${height - 14} L 4 ${height - 14} Q 2 ${height - 14} 2 ${height - 18} L 2 4 Q 2 2 4 2 Z`}
                    fill={ColorPalette[getColor(content.type)].bg}
                    stroke={ColorPalette[getColor(content.type)].border}
                    stroke-width="2"
                    style="filter: drop-shadow(0 4px 0 {ColorPalette[getColor(content.type)].border});"
                ></path>
            </svg>
        </div>
        <div
            class="flex h-full w-full flex-row items-center justify-center gap-4 align-middle"
            style="color: {ColorPalette[getColor(content.type)].text};"
        >
            <div class="whitespace-nowrap font-bold">{content.title}</div>
            <div class="flex flex-row gap-2 align-middle">
                {#each content.contents as item}
                    {#if item.type === 'separator'}
                        <div class="h-5 w-[1px] bg-blue-950"></div>
                    {:else if item.type === 'value'}
                        <div class="flex flex-row items-center justify-center gap-1.5">
                            <div class="whitespace-nowrap">{item.content.title}</div>
                            <input
                                type="text"
                                style="background-color: {ColorPalette[getColor(content.type)]
                                    .text}; border-color: {ColorPalette[getColor(content.type)]
                                    .border}; width: calc({Math.max(2, item.content.value.length)}ch + 0.5rem)"
                                class="flex h-6 min-w-[2ch] items-center rounded-full border-2 p-0 text-center align-middle text-sm text-blue-950 focus:outline-none"
                                bind:value={item.content.value}
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
            {#if isFlag}
                <button
                    on:click={() => {
                        //const children = searchAllChildren(content.id);
                        //formatOutput(children);
                        //window.navigator.clipboard.writeText($output);
                        toast.success('Output copied to clipboard');
                    }}
                    class="flex items-center justify-center rounded-full border-2 p-1"
                    style={`border-color: ${ColorPalette[getColor(content.type)].border}; background-color: ${ColorPalette[getColor(content.type)].text};`}
                >
                    <Icon icon="ic:round-flag" class="h-5 w-5 text-green-400" />
                </button>
            {/if}
        </div>
    </div>
</div>