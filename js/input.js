import { player } from './player.js';

// Input state
export const keys = {};
export const mouse = { locked: false };

export function setupInput(renderer, onBlockSelect) {
    // Keyboard events
    window.addEventListener('keydown', e => {
        keys[e.key.toLowerCase()] = true;

        if (e.key >= '1' && e.key <= '9') {
            onBlockSelect(parseInt(e.key) - 1);
        }
    });

    window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

    // Mouse sensitivity slider
    const sensitivitySlider = document.getElementById('sensitivitySlider');
    const sensitivityValue = document.getElementById('sensitivityValue');

    sensitivitySlider.addEventListener('input', (e) => {
        player.mouseSensitivity = parseFloat(e.target.value);
        sensitivityValue.textContent = player.mouseSensitivity.toFixed(1) + 'x';
    });

    // Pointer lock
    renderer.domElement.addEventListener('click', () => {
        if (window.gameStarted) {
            renderer.domElement.requestPointerLock();
        }
    });

    document.addEventListener('pointerlockchange', () => {
        mouse.locked = document.pointerLockElement === renderer.domElement;
    });

    // Mouse movement
    document.addEventListener('mousemove', (e) => {
        if (!mouse.locked) return;

        const deltaX = e.movementX * 0.002 * player.mouseSensitivity;
        const deltaY = e.movementY * 0.002 * player.mouseSensitivity;

        if (player.smoothMouse) {
            // Update target rotation for smooth interpolation
            player.targetRotation.y -= deltaX;
            player.targetRotation.x -= deltaY;
            player.targetRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, player.targetRotation.x));
        } else {
            // Direct rotation update
            player.rotation.y -= deltaX;
            player.rotation.x -= deltaY;
            player.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, player.rotation.x));
        }
    });

    // Smooth mouse toggle
    const smoothMouseToggle = document.getElementById('smoothMouseToggle');
    smoothMouseToggle.addEventListener('change', (e) => {
        player.smoothMouse = e.target.checked;
        if (!player.smoothMouse) {
            // Sync current and target when disabling
            player.currentRotation.x = player.targetRotation.x;
            player.currentRotation.y = player.targetRotation.y;
        }
    });

    // Prevent context menu
    renderer.domElement.addEventListener('contextmenu', e => e.preventDefault());
}

export function setupBlockInteraction(renderer, camera, onBreakBlock, onPlaceBlock) {
    renderer.domElement.addEventListener('mousedown', (e) => {
        if (!mouse.locked) return;

        if (e.button === 0) {
            onBreakBlock();
        } else if (e.button === 2) {
            onPlaceBlock();
        }
    });
}
