import { blockInfo } from './config.js';

// Inventory system
export const inventory = {
    0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0
};

export let selectedBlock = 0;
let hotbarNeedsUpdate = true;

export function setSelectedBlock(block) {
    selectedBlock = block;
    hotbarNeedsUpdate = true;
}

export function getSelectedBlock() {
    return selectedBlock;
}

export function renderHotbar() {
    if (!hotbarNeedsUpdate) return;
    hotbarNeedsUpdate = false;

    const hotbar = document.getElementById('hotbar');
    hotbar.innerHTML = '';

    const availableBlocks = Object.keys(inventory)
        .map(Number)
        .filter(blockType => inventory[blockType] > 0);

    if (availableBlocks.length === 0) {
        hotbar.innerHTML = '<div style="color: white; padding: 10px; font-size: 14px;">Break blocks to collect them!</div>';
        selectedBlock = -1;
        return;
    }

    if (!availableBlocks.includes(selectedBlock) || selectedBlock === -1) {
        selectedBlock = availableBlocks[0];
    }

    availableBlocks.forEach((blockType) => {
        const slot = document.createElement('div');
        slot.className = 'hotbar-slot';
        if (blockType === selectedBlock) {
            slot.classList.add('selected');
        }
        slot.dataset.block = blockType;

        const preview = document.createElement('div');
        preview.className = 'block-preview';
        const info = blockInfo[blockType];
        if (info.gradient) {
            preview.style.background = info.gradient;
        } else {
            preview.style.background = info.color;
        }

        const label = document.createElement('div');
        label.textContent = info.name;

        const count = document.createElement('div');
        count.style.fontSize = '10px';
        count.style.opacity = '0.8';
        count.textContent = `x${inventory[blockType]}`;

        slot.appendChild(preview);
        slot.appendChild(label);
        slot.appendChild(count);

        slot.addEventListener('click', () => {
            selectedBlock = blockType;
            hotbarNeedsUpdate = true;
            renderHotbar();
            updateInventoryDisplay();
        });

        hotbar.appendChild(slot);
    });
}

export function updateInventoryDisplay() {
    if (selectedBlock === -1) {
        document.getElementById('inventoryDisplay').textContent = 'No blocks collected';
        return;
    }
    const count = inventory[selectedBlock] || 0;
    const name = blockInfo[selectedBlock]?.name || 'Unknown';
    document.getElementById('inventoryDisplay').textContent = `${name}: ${count}`;
}

export function addToInventory(blockType) {
    if (blockType !== null && blockType !== undefined) {
        inventory[blockType]++;
        hotbarNeedsUpdate = true;
        renderHotbar();
        updateInventoryDisplay();
    }
}

export function removeFromInventory(blockType) {
    if (inventory[blockType] > 0) {
        inventory[blockType]--;
        hotbarNeedsUpdate = true;
        renderHotbar();
        updateInventoryDisplay();
        return true;
    }
    return false;
}

export function selectBlockByIndex(index) {
    const availableBlocks = Object.keys(inventory)
        .map(Number)
        .filter(blockType => inventory[blockType] > 0);

    if (index < availableBlocks.length) {
        selectedBlock = availableBlocks[index];
        hotbarNeedsUpdate = true;
        renderHotbar();
        updateInventoryDisplay();
    }
}

export function updatePositionDisplay(position, chunk) {
    document.getElementById('position').textContent =
        `${position.x.toFixed(1)}, ${position.y.toFixed(1)}, ${position.z.toFixed(1)}`;
    document.getElementById('chunk').textContent =
        `${chunk.cx}, ${chunk.cz}`;
}

export function updatePerformanceDisplay(fps, chunkCount, drawCalls) {
    document.getElementById('fps').textContent = fps;
    document.getElementById('chunkCount').textContent = chunkCount;
    document.getElementById('drawCalls').textContent = drawCalls;
}
