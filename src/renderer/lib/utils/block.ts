import { blockspace, output, pushUndo, workspace } from '$lib/stores';
import type { Block, WorkspaceState } from '$lib/types';
import { writable, type Writable } from 'svelte/store';
import { toast } from 'svelte-sonner';

const timeoutState: Writable<boolean> = writable(false);
const offset = 40;

const addBlock = (content: Block) => {
    const newId = Math.random().toString(36).substring(7);
    workspace.update((ws) => {
        let newCon = JSON.parse(JSON.stringify(content));
        newCon.id = newId;
        ws.blocks.set(newId, newCon);
        return ws;
    });
    pushUndo();
};

const removeBlock = (blockId: string) => {
    workspace.update((ws) => {
        const block = ws.blocks.get(blockId);
        if (!block) return ws;

        const removeChildren = (id: string) => {
            const childBlock = ws.blocks.get(id);
            if (childBlock && childBlock.children) {
                removeChildren(childBlock.children);
            }
            ws.blocks.delete(id);
        };

        removeChildren(blockId);

        if (block.parentId) {
            const parentBlock = ws.blocks.get(block.parentId);
            if (parentBlock) {
                parentBlock.children = '';
                ws.blocks.set(parentBlock.id, parentBlock);
            }
        }

        ws.blocks.delete(block.id);

        ws.blocks.forEach((b) => {
            updateBlockPositions(ws, b.id);
        });

        return ws;
    });
    pushUndo();
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

const onDrag = (content: Block) => {
    workspace.update((ws) => {
        const block = ws.blocks.get(content.id);
        if (!block) return ws;
        console.log('dragging', block);
        updateChildrenPositions(ws, block);
        updateZIndex(ws, content.id);

        block.position.x = content.position.x;
        block.position.y = content.position.y;

        ws.blocks.set(block.id, block);

        return ws;
    });
    handleConnections(content);
};

const onDragStart = (content: Block) => {
    workspace.update((ws) => {
        const block = ws.blocks.get(content.id);
        if (!block) return ws;

        if (block.parentId) {
            timeoutState.set(true);
            console.log('timeout');
            const parentBlock = ws.blocks.get(block.parentId);
            if (parentBlock) {
                parentBlock.children = '';
                ws.blocks.set(parentBlock.id, parentBlock);
            }
            block.parentId = '';
        }

        return ws;
    });
};

const onDragEnd = (event: { clientX: number; clientY: number }, content: Block) => {
    timeoutState.set(false);

    document.elementsFromPoint(event.clientX, event.clientY).forEach((element) => {
        if (element.classList.contains('trash')) {
            removeBlock(content.id);
            toast.success('Block removed');
        }
    });
    pushUndo();
};

const updateChildrenPositions = (ws: WorkspaceState, block: Block) => {
    let currentBlock = block;
    let currentOffset = offset;

    while (currentBlock.children) {
        const childBlock = ws.blocks.get(currentBlock.children);
        if (!childBlock) break;

        childBlock.position = {
            x: block.position.x,
            y: block.position.y + currentOffset
        };
        ws.blocks.set(childBlock.id, childBlock);
        currentBlock = childBlock;
        currentOffset += offset;
    }
};

const updateZIndex = (ws: WorkspaceState, blockId: string) => {
    const block = ws.blocks.get(blockId);
    if (!block) return;

    ws.blocks.forEach((b) => {
        b.zIndex = 0;
        ws.blocks.set(b.id, b);
    });

    let zIndex = 1;
    const setZIndex = (id: string) => {
        const b = ws.blocks.get(id);
        if (!b) return;
        b.zIndex = zIndex++;
        ws.blocks.set(id, b);
        if (b.children) setZIndex(b.children);
    };

    setZIndex(blockId);
};

const findRootBlock = (
    ws: WorkspaceState,
    blockId: string,
    visited: Set<string> = new Set()
): Block | null => {
    if (visited.has(blockId)) return null;

    const block = ws.blocks.get(blockId);
    if (!block) return null;

    visited.add(blockId);

    if (!block.parentId) return block;

    return findRootBlock(ws, block.parentId, visited);
};

const updateBlockPositions = (ws: WorkspaceState, blockId: string, depth: number = 0) => {
    const block = ws.blocks.get(blockId);
    if (!block) return;

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

            updateBlockPositions(ws, block.children, depth + 1);
        }
    }
};

const handleBlockConnection = (ws: WorkspaceState, sourceId: string, targetId: string) => {
    const sourceBlock = ws.blocks.get(sourceId);
    const targetBlock = ws.blocks.get(targetId);

    if (!sourceBlock || !targetBlock) return false;

    let timeout = false;
    timeoutState.subscribe((state) => {
        timeout = state;
    })();

    if (timeout || sourceBlock.children || targetId === sourceId) return false;

    console.log('connecting', sourceBlock, targetBlock);
    const checkCircularReference = (blockId: string, targetId: string): boolean => {
        let current: Block | undefined = ws.blocks.get(blockId);
        while (current) {
            if (current.id === targetId) return true;
            current = current.parentId ? ws.blocks.get(current.parentId) : undefined;
        }
        return false;
    };

    if (checkCircularReference(targetId, sourceId)) return false;

    if (targetBlock.parentId) {
        const oldParent = ws.blocks.get(targetBlock.parentId);
        if (oldParent) {
            oldParent.children = '';
            ws.blocks.set(oldParent.id, oldParent);
        }
    }

    sourceBlock.children = targetId;
    targetBlock.parentId = sourceId;

    updateBlockPositions(ws, sourceId);
    updateZIndex(ws, sourceId);

    ws.blocks.set(sourceId, sourceBlock);
    ws.blocks.set(targetId, targetBlock);

    return true;
};

const handleConnections = (content: Block) => {
    workspace.update((ws) => {
        let space: HTMLElement | null = null;
        blockspace.subscribe((blockspace) => {
            space = blockspace;
        });

        if (!space) return ws;
        const inputs = (space as HTMLElement).querySelectorAll('.input');
        const outputs = (space as HTMLElement).querySelectorAll('.output');

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

const formatOutput = (blocks: Block[]) => {
    const outputText = blocks
        .filter((block) => block.type !== 'flag')
        .map((block) => {
            let blockOutput = block.output;
            block.contents.forEach((content) => {
                if (content === 'space') return;
                const regex = new RegExp(`\\$\\{${content.id}\\}`, 'g');
                blockOutput = blockOutput.replace(regex, content.value);
            });
            return blockOutput;
        })
        .join('\n');

    output.set(outputText.trim());
};

export {
    addBlock,
    removeBlock,
    formatOutput,
    onDrag,
    onDragStart,
    onDragEnd,
    updateBlockPositions,
    findRootBlock,
    handleBlockConnection,
    handleConnections,
    updateZIndex
};