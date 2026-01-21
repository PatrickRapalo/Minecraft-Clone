import * as THREE from 'three';

// Simple noise function
function noise(x, y, seed = 0) {
    const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
    return n - Math.floor(n);
}

// Procedural texture generation
export function createProceduralTexture(type) {
    const size = 16;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    switch(type) {
        case 'dirt':
            ctx.fillStyle = '#8B7355';
            ctx.fillRect(0, 0, size, size);
            for (let x = 0; x < size; x++) {
                for (let y = 0; y < size; y++) {
                    const n = noise(x, y, 1);
                    const brightness = 0.85 + n * 0.3;
                    const r = Math.floor(139 * brightness);
                    const g = Math.floor(115 * brightness);
                    const b = Math.floor(85 * brightness);
                    ctx.fillStyle = `rgb(${r},${g},${b})`;
                    ctx.fillRect(x, y, 1, 1);
                }
            }
            break;

        case 'grass_top':
            for (let x = 0; x < size; x++) {
                for (let y = 0; y < size; y++) {
                    const n = noise(x, y, 2);
                    const brightness = 0.8 + n * 0.4;
                    const r = Math.floor(34 * brightness);
                    const g = Math.floor(139 * brightness);
                    const b = Math.floor(34 * brightness);
                    ctx.fillStyle = `rgb(${r},${g},${b})`;
                    ctx.fillRect(x, y, 1, 1);
                }
            }
            break;

        case 'grass_side':
            // Top portion green, bottom portion dirt
            for (let x = 0; x < size; x++) {
                for (let y = 0; y < size; y++) {
                    const n = noise(x, y, 3);
                    const grassLine = 3 + Math.floor(noise(x, 0, 4) * 3);
                    if (y < grassLine) {
                        const brightness = 0.8 + n * 0.4;
                        const r = Math.floor(34 * brightness);
                        const g = Math.floor(139 * brightness);
                        const b = Math.floor(34 * brightness);
                        ctx.fillStyle = `rgb(${r},${g},${b})`;
                    } else {
                        const brightness = 0.85 + n * 0.3;
                        const r = Math.floor(139 * brightness);
                        const g = Math.floor(115 * brightness);
                        const b = Math.floor(85 * brightness);
                        ctx.fillStyle = `rgb(${r},${g},${b})`;
                    }
                    ctx.fillRect(x, y, 1, 1);
                }
            }
            break;

        case 'stone':
            for (let x = 0; x < size; x++) {
                for (let y = 0; y < size; y++) {
                    const n1 = noise(x, y, 5);
                    const n2 = noise(x * 2, y * 2, 6) * 0.5;
                    const n = (n1 + n2) / 1.5;
                    const brightness = 0.6 + n * 0.5;
                    const base = Math.floor(128 * brightness);
                    // Add occasional dark crack pixels
                    if (noise(x, y, 7) > 0.92) {
                        ctx.fillStyle = `rgb(60,60,60)`;
                    } else {
                        ctx.fillStyle = `rgb(${base},${base},${base})`;
                    }
                    ctx.fillRect(x, y, 1, 1);
                }
            }
            break;

        case 'wood':
            for (let x = 0; x < size; x++) {
                for (let y = 0; y < size; y++) {
                    // Vertical grain pattern
                    const grain = Math.sin(x * 1.5 + noise(x, y, 8) * 2) * 0.5 + 0.5;
                    const n = noise(x, y, 9);
                    const brightness = 0.7 + grain * 0.3 + n * 0.1;
                    const r = Math.floor(139 * brightness);
                    const g = Math.floor(69 * brightness);
                    const b = Math.floor(19 * brightness);
                    ctx.fillStyle = `rgb(${r},${g},${b})`;
                    ctx.fillRect(x, y, 1, 1);
                }
            }
            break;

        case 'sand':
            for (let x = 0; x < size; x++) {
                for (let y = 0; y < size; y++) {
                    const n = noise(x, y, 10);
                    const brightness = 0.85 + n * 0.3;
                    const r = Math.floor(255 * brightness);
                    const g = Math.floor(215 * brightness);
                    const b = Math.floor(100 * brightness);
                    ctx.fillStyle = `rgb(${Math.min(255,r)},${Math.min(255,g)},${Math.min(255,b)})`;
                    ctx.fillRect(x, y, 1, 1);
                }
            }
            break;

        case 'water':
            for (let x = 0; x < size; x++) {
                for (let y = 0; y < size; y++) {
                    const n = noise(x, y, 11);
                    const gradient = 1 - (y / size) * 0.3;
                    const brightness = (0.8 + n * 0.2) * gradient;
                    const r = Math.floor(65 * brightness);
                    const g = Math.floor(105 * brightness);
                    const b = Math.floor(225 * brightness);
                    ctx.fillStyle = `rgb(${r},${g},${b})`;
                    ctx.fillRect(x, y, 1, 1);
                }
            }
            break;

        case 'snow':
            for (let x = 0; x < size; x++) {
                for (let y = 0; y < size; y++) {
                    const n = noise(x, y, 12);
                    const brightness = 0.92 + n * 0.08;
                    // Subtle blue tint
                    const r = Math.floor(250 * brightness);
                    const g = Math.floor(250 * brightness);
                    const b = Math.floor(255 * brightness);
                    ctx.fillStyle = `rgb(${Math.min(255,r)},${Math.min(255,g)},${Math.min(255,b)})`;
                    ctx.fillRect(x, y, 1, 1);
                }
            }
            break;

        case 'dark_grass':
            for (let x = 0; x < size; x++) {
                for (let y = 0; y < size; y++) {
                    const n = noise(x, y, 13);
                    const brightness = 0.75 + n * 0.35;
                    const r = Math.floor(47 * brightness);
                    const g = Math.floor(79 * brightness);
                    const b = Math.floor(47 * brightness);
                    ctx.fillStyle = `rgb(${r},${g},${b})`;
                    ctx.fillRect(x, y, 1, 1);
                }
            }
            break;
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    return texture;
}
