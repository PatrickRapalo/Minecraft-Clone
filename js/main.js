import * as THREE from 'three';
import { RENDER_DISTANCE } from './config.js';
import {
    world, chunks, chunkMeshes,
    worldToChunk, generateChunkData, buildChunkMesh,
    processChunkRebuildQueue, getBlock, setBlock
} from './world.js';
import { player, updatePlayer, raycastBlocks } from './player.js';
import { keys, mouse, setupInput, setupBlockInteraction } from './input.js';
import {
    inventory, selectedBlock, getSelectedBlock,
    renderHotbar, updateInventoryDisplay,
    addToInventory, removeFromInventory, selectBlockByIndex,
    updatePositionDisplay, updatePerformanceDisplay
} from './ui.js';

// Game state
window.gameStarted = false;

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
scene.fog = new THREE.Fog(0x87CEEB, 0, 150);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);

const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(50, 100, 50);
scene.add(directionalLight);

// Initialize camera position
camera.position.copy(player.position);
camera.position.y += player.height * 0.9;

// Setup input handlers
setupInput(renderer, selectBlockByIndex);

// Block interaction handlers
function handleBreakBlock() {
    const hit = raycastBlocks(camera);
    if (!hit.hit) return;

    const blockType = getBlock(hit.position.x, hit.position.y, hit.position.z);
    setBlock(hit.position.x, hit.position.y, hit.position.z, null);
    addToInventory(blockType);
}

function handlePlaceBlock() {
    const hit = raycastBlocks(camera);
    if (!hit.hit) return;

    const currentSelected = getSelectedBlock();
    if (!removeFromInventory(currentSelected)) return;

    const placePos = hit.position.clone().add(hit.normal);

    const playerBox = new THREE.Box3(
        new THREE.Vector3(
            player.position.x - player.radius,
            player.position.y,
            player.position.z - player.radius
        ),
        new THREE.Vector3(
            player.position.x + player.radius,
            player.position.y + player.height,
            player.position.z + player.radius
        )
    );

    const blockBox = new THREE.Box3(
        new THREE.Vector3(placePos.x - 0.5, placePos.y - 0.5, placePos.z - 0.5),
        new THREE.Vector3(placePos.x + 0.5, placePos.y + 0.5, placePos.z + 0.5)
    );

    if (!playerBox.intersectsBox(blockBox)) {
        setBlock(placePos.x, placePos.y, placePos.z, currentSelected);
    } else {
        addToInventory(currentSelected);
    }
}

setupBlockInteraction(renderer, camera, handleBreakBlock, handlePlaceBlock);

// Initialize world
async function initWorld() {
    const instructionsEl = document.getElementById('instructions');
    const buttonEl = instructionsEl.querySelector('button');
    const progressBar = document.getElementById('loadingProgress');

    buttonEl.textContent = 'Generating World...';
    buttonEl.disabled = true;

    const chunksToGenerate = [];

    for (let cx = -RENDER_DISTANCE; cx <= RENDER_DISTANCE; cx++) {
        for (let cz = -RENDER_DISTANCE; cz <= RENDER_DISTANCE; cz++) {
            chunksToGenerate.push({ cx, cz });
        }
    }

    // Generate all chunk data
    for (let i = 0; i < chunksToGenerate.length; i++) {
        const { cx, cz } = chunksToGenerate[i];
        generateChunkData(cx, cz);

        const progress = Math.floor((i / chunksToGenerate.length) * 50);
        progressBar.style.width = progress + '%';

        if (i % 5 === 0) {
            await new Promise(resolve => setTimeout(resolve, 0));
        }
    }

    buttonEl.textContent = 'Building Meshes...';

    // Build meshes
    for (let i = 0; i < chunksToGenerate.length; i++) {
        const { cx, cz } = chunksToGenerate[i];
        buildChunkMesh(cx, cz, scene);

        const progress = 50 + Math.floor((i / chunksToGenerate.length) * 50);
        progressBar.style.width = progress + '%';

        if (i % 2 === 0) {
            await new Promise(resolve => setTimeout(resolve, 0));
        }
    }

    progressBar.style.width = '100%';
    buttonEl.textContent = 'CLICK TO START';
    buttonEl.disabled = false;
}

// Game update
function update(dt) {
    if (!window.gameStarted) return;

    updatePlayer(dt, camera, keys);

    // Dynamic chunk loading
    const playerChunk = worldToChunk(player.position.x, player.position.z);

    for (let cx = playerChunk.cx - RENDER_DISTANCE; cx <= playerChunk.cx + RENDER_DISTANCE; cx++) {
        for (let cz = playerChunk.cz - RENDER_DISTANCE; cz <= playerChunk.cz + RENDER_DISTANCE; cz++) {
            const chunkKey = `${cx},${cz}`;
            if (!chunks[chunkKey]) {
                generateChunkData(cx, cz);
            }
        }
    }

    // Process chunk rebuild queue (non-blocking)
    processChunkRebuildQueue(scene);

    updatePositionDisplay(player.position, playerChunk);
}

// Performance monitoring
let frameCount = 0;
let lastFpsUpdate = performance.now();

// Animation loop
let lastTime = performance.now();

function animate() {
    requestAnimationFrame(animate);

    const now = performance.now();
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    update(dt);
    renderer.render(scene, camera);

    frameCount++;
    if (now - lastFpsUpdate > 1000) {
        updatePerformanceDisplay(frameCount, Object.keys(chunkMeshes).length, renderer.info.render.calls);
        frameCount = 0;
        lastFpsUpdate = now;
    }
}

// Window resize handler
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start game function (called from HTML button)
window.startGame = function() {
    document.getElementById('instructions').classList.add('hidden');
    window.gameStarted = true;
    renderer.domElement.requestPointerLock();
};

// Initialize
initWorld();
renderHotbar();
animate();
