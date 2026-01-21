import * as THREE from 'three';
import { CHUNK_SIZE, WORLD_HEIGHT, CHUNK_REBUILD_TIME_BUDGET, FACE_DIRS } from './config.js';
import { materials, faceGeometries } from './blocks.js';
import { TerrainGenerator } from './terrain.js';

// World data
export const world = {};
export const chunks = {};
export const chunkMeshes = {};
const chunkRebuildQueue = [];

// Terrain generator instance
const terrainGen = new TerrainGenerator();

// Helper functions
export function getBlockKey(x, y, z) {
    return `${x},${y},${z}`;
}

export function getChunkKey(cx, cz) {
    return `${cx},${cz}`;
}

export function worldToChunk(x, z) {
    return {
        cx: Math.floor(x / CHUNK_SIZE),
        cz: Math.floor(z / CHUNK_SIZE)
    };
}

export function getBlock(x, y, z) {
    return world[getBlockKey(x, y, z)] || null;
}

export function setBlock(x, y, z, type) {
    const key = getBlockKey(x, y, z);

    if (type === null) {
        delete world[key];
    } else {
        world[key] = type;
    }

    // Queue chunk for rebuild (non-blocking)
    const { cx, cz } = worldToChunk(x, z);
    const chunkKey = getChunkKey(cx, cz);
    if (chunks[chunkKey] && !chunks[chunkKey].queued) {
        chunks[chunkKey].queued = true;
        chunkRebuildQueue.push({ cx, cz, chunkKey });
    }

    // Also queue adjacent chunks if block is at chunk edge
    const lx = ((x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((z % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;

    const adjacentChunks = [];
    if (lx === 0) adjacentChunks.push({ cx: cx - 1, cz });
    if (lx === CHUNK_SIZE - 1) adjacentChunks.push({ cx: cx + 1, cz });
    if (lz === 0) adjacentChunks.push({ cx, cz: cz - 1 });
    if (lz === CHUNK_SIZE - 1) adjacentChunks.push({ cx, cz: cz + 1 });

    for (const adj of adjacentChunks) {
        const adjKey = getChunkKey(adj.cx, adj.cz);
        if (chunks[adjKey] && !chunks[adjKey].queued) {
            chunks[adjKey].queued = true;
            chunkRebuildQueue.push({ cx: adj.cx, cz: adj.cz, chunkKey: adjKey });
        }
    }
}

// Process chunk rebuild queue with time budget (non-blocking)
export function processChunkRebuildQueue(scene) {
    if (chunkRebuildQueue.length === 0) return;

    const startTime = performance.now();

    while (chunkRebuildQueue.length > 0) {
        const elapsed = performance.now() - startTime;
        if (elapsed >= CHUNK_REBUILD_TIME_BUDGET) break;

        const { cx, cz, chunkKey } = chunkRebuildQueue.shift();
        if (chunks[chunkKey]) {
            chunks[chunkKey].queued = false;
            buildChunkMesh(cx, cz, scene);
        }
    }
}

// Generate chunk data
export function generateChunkData(cx, cz) {
    const chunkKey = getChunkKey(cx, cz);
    if (chunks[chunkKey]) return;

    chunks[chunkKey] = { needsRebuild: false };

    const startX = cx * CHUNK_SIZE;
    const startZ = cz * CHUNK_SIZE;

    for (let lx = 0; lx < CHUNK_SIZE; lx++) {
        for (let lz = 0; lz < CHUNK_SIZE; lz++) {
            const x = startX + lx;
            const z = startZ + lz;

            const height = terrainGen.getTerrainHeight(x, z);
            const biome = terrainGen.getBiome(x, z);
            const surfaceBlock = terrainGen.getSurfaceBlock(biome);

            for (let y = 0; y <= height && y < WORLD_HEIGHT; y++) {
                let blockType;

                if (y === height) {
                    blockType = surfaceBlock;
                } else if (y >= height - 3) {
                    blockType = (biome === 'desert') ? 4 : 0;
                } else {
                    blockType = 2;
                }

                world[getBlockKey(x, y, z)] = blockType;
            }

            // Add trees
            if (biome === 'forest' && Math.random() < 0.03) {
                const treeHeight = 4;
                for (let ty = 1; ty <= treeHeight; ty++) {
                    world[getBlockKey(x, height + ty, z)] = 3;
                }
                world[getBlockKey(x, height + treeHeight + 1, z)] = 7;
                world[getBlockKey(x + 1, height + treeHeight, z)] = 7;
                world[getBlockKey(x - 1, height + treeHeight, z)] = 7;
                world[getBlockKey(x, height + treeHeight, z + 1)] = 7;
                world[getBlockKey(x, height + treeHeight, z - 1)] = 7;
            }
        }
    }

    chunks[chunkKey].needsRebuild = true;
}

// Check if a face should be visible (adjacent to air or transparent block)
function isFaceVisible(x, y, z, dir) {
    const neighbor = getBlock(x + dir.x, y + dir.y, z + dir.z);
    // Face is visible if neighbor is air (null) or water (transparent)
    return neighbor === null || neighbor === 5;
}

// Optimized mesh building with face culling
export function buildChunkMesh(cx, cz, scene) {
    const chunkKey = getChunkKey(cx, cz);
    const chunk = chunks[chunkKey];
    if (!chunk) return;

    chunk.needsRebuild = false;

    // Remove old mesh
    if (chunkMeshes[chunkKey]) {
        scene.remove(chunkMeshes[chunkKey]);
        chunkMeshes[chunkKey].traverse((child) => {
            if (child.geometry) child.geometry.dispose();
        });
        delete chunkMeshes[chunkKey];
    }

    const startX = cx * CHUNK_SIZE;
    const startZ = cz * CHUNK_SIZE;

    // Collect visible faces by block type and face direction
    const facesByType = {};
    for (let i = 0; i <= 7; i++) {
        facesByType[i] = { px: [], nx: [], py: [], ny: [], pz: [], nz: [] };
    }

    // Scan chunk and collect visible faces
    for (let lx = 0; lx < CHUNK_SIZE; lx++) {
        for (let lz = 0; lz < CHUNK_SIZE; lz++) {
            for (let y = 0; y < WORLD_HEIGHT; y++) {
                const x = startX + lx;
                const z = startZ + lz;
                const blockType = getBlock(x, y, z);

                if (blockType === null) continue;

                // Check each face for visibility
                for (const [faceName, dir] of Object.entries(FACE_DIRS)) {
                    if (isFaceVisible(x, y, z, dir)) {
                        facesByType[blockType][faceName].push({ x, y, z });
                    }
                }
            }
        }
    }

    const group = new THREE.Group();

    // Build instanced meshes for each block type and face
    for (let blockType = 0; blockType <= 7; blockType++) {
        const faces = facesByType[blockType];

        if (blockType === 1) {
            // Grass blocks - use merged geometry approach for face-based materials
            for (const [faceName, positions] of Object.entries(faces)) {
                if (positions.length === 0) continue;

                // Select material based on face
                let material;
                if (faceName === 'py') {
                    material = materials[1]; // Top - green
                } else if (faceName === 'ny') {
                    material = materials['1_bottom']; // Bottom - dirt
                } else {
                    material = materials['1_side']; // Sides - gradient
                }

                const instancedMesh = new THREE.InstancedMesh(
                    faceGeometries[faceName],
                    material,
                    positions.length
                );

                const matrix = new THREE.Matrix4();
                positions.forEach(({ x, y, z }, i) => {
                    matrix.setPosition(x, y, z);
                    instancedMesh.setMatrixAt(i, matrix);
                });

                instancedMesh.instanceMatrix.needsUpdate = true;
                group.add(instancedMesh);
            }
        } else {
            // Other blocks - combine all visible faces
            for (const [faceName, positions] of Object.entries(faces)) {
                if (positions.length === 0) continue;

                const instancedMesh = new THREE.InstancedMesh(
                    faceGeometries[faceName],
                    materials[blockType],
                    positions.length
                );

                const matrix = new THREE.Matrix4();
                positions.forEach(({ x, y, z }, i) => {
                    matrix.setPosition(x, y, z);
                    instancedMesh.setMatrixAt(i, matrix);
                });

                instancedMesh.instanceMatrix.needsUpdate = true;
                group.add(instancedMesh);
            }
        }
    }

    scene.add(group);
    chunkMeshes[chunkKey] = group;
}
