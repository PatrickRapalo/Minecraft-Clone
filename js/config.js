// World configuration constants
export const CHUNK_SIZE = 16;
export const RENDER_DISTANCE = 3;
export const WORLD_HEIGHT = 20;
export const CHUNK_REBUILD_TIME_BUDGET = 4; // ms per frame for chunk rebuilds

// Physics constants
export const GRAVITY = 20;

// Block metadata
export const blockInfo = {
    0: { name: 'Dirt', color: '#8B7355' },
    1: { name: 'Grass', gradient: 'linear-gradient(to bottom, #228B22 0%, #228B22 70%, #8B7355 70%, #8B7355 100%)' },
    2: { name: 'Stone', color: '#808080' },
    3: { name: 'Wood', color: '#8B4513' },
    4: { name: 'Sand', color: '#FFD700' },
    5: { name: 'Water', color: '#4169E1' },
    6: { name: 'Snow', color: '#FFFFFF' },
    7: { name: 'Dark Grass', color: '#2F4F2F' }
};

// Face directions for culling
export const FACE_DIRS = {
    px: { x: 1, y: 0, z: 0 },   // +X (right)
    nx: { x: -1, y: 0, z: 0 },  // -X (left)
    py: { x: 0, y: 1, z: 0 },   // +Y (top)
    ny: { x: 0, y: -1, z: 0 },  // -Y (bottom)
    pz: { x: 0, y: 0, z: 1 },   // +Z (front)
    nz: { x: 0, y: 0, z: -1 }   // -Z (back)
};
