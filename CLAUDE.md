# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A browser-based Minecraft clone built as a single HTML file using Three.js for 3D rendering. The game runs entirely client-side with no build process or server requirements.

**Live demo:** https://patrickrapalo.github.io/Minecraft-Clone/MC_clone.html

## Running the Project

Open `MC_clone.html` directly in a web browser. No build step, dependencies to install, or server required.

## Architecture

The entire game is contained in `MC_clone.html`:

- **Rendering**: Three.js (loaded via CDN import map) with WebGL renderer
- **World System**: Chunk-based terrain stored in a `world` object keyed by `"x,y,z"` strings
- **Terrain Generation**: Procedural biome-based generation using simple sine-based noise (`TerrainGenerator` class)
- **Block Types**: 8 block types (dirt, grass, stone, wood, sand, water, snow, dark grass) with numeric IDs 0-7
- **Performance**: Uses `THREE.InstancedMesh` for non-grass blocks; grass blocks use individual meshes for multi-material faces

### Key Constants

- `CHUNK_SIZE = 16` - blocks per chunk dimension
- `RENDER_DISTANCE = 3` - chunks loaded around player
- `WORLD_HEIGHT = 20` - maximum world height

### Core Data Structures

- `world` - block data keyed by `"x,y,z"` strings
- `chunks` - chunk metadata keyed by `"cx,cz"` strings
- `chunkMeshes` - Three.js mesh groups per chunk
- `inventory` - block counts by type ID
- `player` - position, velocity, rotation, physics state
