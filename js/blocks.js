import * as THREE from 'three';
import { createProceduralTexture } from './textures.js';

// Block materials with procedural textures
export const materials = {
    0: new THREE.MeshLambertMaterial({ map: createProceduralTexture('dirt') }),
    1: new THREE.MeshLambertMaterial({ map: createProceduralTexture('grass_top') }),
    '1_side': new THREE.MeshLambertMaterial({ map: createProceduralTexture('grass_side') }),
    '1_bottom': new THREE.MeshLambertMaterial({ map: createProceduralTexture('dirt') }),
    2: new THREE.MeshLambertMaterial({ map: createProceduralTexture('stone') }),
    3: new THREE.MeshLambertMaterial({ map: createProceduralTexture('wood') }),
    4: new THREE.MeshLambertMaterial({ map: createProceduralTexture('sand') }),
    5: new THREE.MeshLambertMaterial({ map: createProceduralTexture('water'), transparent: true, opacity: 0.6 }),
    6: new THREE.MeshLambertMaterial({ map: createProceduralTexture('snow') }),
    7: new THREE.MeshLambertMaterial({ map: createProceduralTexture('dark_grass') }),
};

// Create face geometry (a single quad)
function createFaceGeometry(face) {
    const vertices = [];
    const normals = [];
    const uvs = [];
    const indices = [];

    // Half size for easier vertex positioning
    const h = 0.5;

    switch(face) {
        case 'px': // +X face
            vertices.push(h, -h, -h,  h, h, -h,  h, h, h,  h, -h, h);
            normals.push(1, 0, 0,  1, 0, 0,  1, 0, 0,  1, 0, 0);
            break;
        case 'nx': // -X face
            vertices.push(-h, -h, h,  -h, h, h,  -h, h, -h,  -h, -h, -h);
            normals.push(-1, 0, 0,  -1, 0, 0,  -1, 0, 0,  -1, 0, 0);
            break;
        case 'py': // +Y face (top)
            vertices.push(-h, h, -h,  -h, h, h,  h, h, h,  h, h, -h);
            normals.push(0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0);
            break;
        case 'ny': // -Y face (bottom)
            vertices.push(-h, -h, h,  -h, -h, -h,  h, -h, -h,  h, -h, h);
            normals.push(0, -1, 0,  0, -1, 0,  0, -1, 0,  0, -1, 0);
            break;
        case 'pz': // +Z face
            vertices.push(-h, -h, h,  h, -h, h,  h, h, h,  -h, h, h);
            normals.push(0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1);
            break;
        case 'nz': // -Z face
            vertices.push(h, -h, -h,  -h, -h, -h,  -h, h, -h,  h, h, -h);
            normals.push(0, 0, -1,  0, 0, -1,  0, 0, -1,  0, 0, -1);
            break;
    }

    uvs.push(0, 0,  1, 0,  1, 1,  0, 1);
    indices.push(0, 1, 2,  0, 2, 3);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    return geometry;
}

// Pre-create face geometries
export const faceGeometries = {
    px: createFaceGeometry('px'),
    nx: createFaceGeometry('nx'),
    py: createFaceGeometry('py'),
    ny: createFaceGeometry('ny'),
    pz: createFaceGeometry('pz'),
    nz: createFaceGeometry('nz')
};
