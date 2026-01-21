import * as THREE from 'three';
import { GRAVITY } from './config.js';
import { getBlock } from './world.js';

// Exponential smoothing helper (frame-rate independent)
function expSmooth(current, target, factor, dt) {
    const smoothing = 1 - Math.pow(1 - factor, dt * 60);
    return current + (target - current) * smoothing;
}

// Player state
export const player = {
    position: new THREE.Vector3(0, 25, 0),
    velocity: new THREE.Vector3(0, 0, 0),
    rotation: new THREE.Euler(0, 0, 0, 'YXZ'),
    targetRotation: { x: 0, y: 0 }, // For smooth mouse
    currentRotation: { x: 0, y: 0 },
    speed: 5,
    jumpPower: 8,
    onGround: false,
    height: 1.8,
    radius: 0.25,
    mouseSensitivity: 1.0,
    smoothMouse: true,
    mouseSmoothFactor: 0.15, // Lower = smoother, higher = more responsive
    moveAcceleration: 25, // Units per second squared
    moveDeceleration: 20  // How fast to slow down
};

export function updatePlayer(dt, camera, keys) {
    // Smooth mouse interpolation
    if (player.smoothMouse) {
        player.currentRotation.x = expSmooth(player.currentRotation.x, player.targetRotation.x, player.mouseSmoothFactor, dt);
        player.currentRotation.y = expSmooth(player.currentRotation.y, player.targetRotation.y, player.mouseSmoothFactor, dt);
        player.rotation.x = player.currentRotation.x;
        player.rotation.y = player.currentRotation.y;
    }

    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();

    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    let moveX = 0, moveZ = 0;
    if (keys['w']) { moveX += forward.x; moveZ += forward.z; }
    if (keys['s']) { moveX -= forward.x; moveZ -= forward.z; }
    if (keys['a']) { moveX -= right.x; moveZ -= right.z; }
    if (keys['d']) { moveX += right.x; moveZ += right.z; }

    const len = Math.sqrt(moveX * moveX + moveZ * moveZ);
    if (len > 0) {
        moveX /= len;
        moveZ /= len;
    }

    // Movement easing with acceleration/deceleration
    const targetVelX = moveX * player.speed;
    const targetVelZ = moveZ * player.speed;

    // Use acceleration when moving, deceleration when stopping
    const accelX = (Math.abs(targetVelX) > Math.abs(player.velocity.x) || Math.sign(targetVelX) !== Math.sign(player.velocity.x))
        ? player.moveAcceleration : player.moveDeceleration;
    const accelZ = (Math.abs(targetVelZ) > Math.abs(player.velocity.z) || Math.sign(targetVelZ) !== Math.sign(player.velocity.z))
        ? player.moveAcceleration : player.moveDeceleration;

    // Lerp velocity toward target
    const smoothFactorX = 1 - Math.exp(-accelX * dt);
    const smoothFactorZ = 1 - Math.exp(-accelZ * dt);

    player.velocity.x += (targetVelX - player.velocity.x) * smoothFactorX;
    player.velocity.z += (targetVelZ - player.velocity.z) * smoothFactorZ;

    // Snap to zero when very close to prevent drift
    if (Math.abs(player.velocity.x) < 0.01 && Math.abs(targetVelX) < 0.01) player.velocity.x = 0;
    if (Math.abs(player.velocity.z) < 0.01 && Math.abs(targetVelZ) < 0.01) player.velocity.z = 0;

    if (keys[' '] && player.onGround) {
        player.velocity.y = player.jumpPower;
        player.onGround = false;
    }

    player.velocity.y -= GRAVITY * dt;

    const nextPos = player.position.clone();
    nextPos.x += player.velocity.x * dt;
    nextPos.y += player.velocity.y * dt;
    nextPos.z += player.velocity.z * dt;

    player.onGround = false;

    const checkY = nextPos.y - 0.1;
    let hitGround = false;

    for (let x = Math.floor(nextPos.x - player.radius); x <= Math.floor(nextPos.x + player.radius); x++) {
        for (let z = Math.floor(nextPos.z - player.radius); z <= Math.floor(nextPos.z + player.radius); z++) {
            const blockBelow = getBlock(x, Math.floor(checkY), z);
            if (blockBelow !== null && player.velocity.y <= 0) {
                hitGround = true;
                break;
            }
        }
        if (hitGround) break;
    }

    if (hitGround) {
        nextPos.y = Math.floor(checkY) + 1;
        player.velocity.y = 0;
        player.onGround = true;
    }

    const headY = nextPos.y + player.height;
    for (let x = Math.floor(nextPos.x - player.radius); x <= Math.floor(nextPos.x + player.radius); x++) {
        for (let z = Math.floor(nextPos.z - player.radius); z <= Math.floor(nextPos.z + player.radius); z++) {
            if (getBlock(x, Math.floor(headY), z) !== null && player.velocity.y > 0) {
                player.velocity.y = 0;
            }
        }
    }

    if (player.velocity.x !== 0) {
        const checkXPos = nextPos.x + (player.velocity.x > 0 ? player.radius : -player.radius);
        let hitWallX = false;

        for (let y = Math.floor(nextPos.y); y <= Math.floor(nextPos.y + player.height - 0.1); y++) {
            for (let z = Math.floor(nextPos.z - player.radius); z <= Math.floor(nextPos.z + player.radius); z++) {
                if (getBlock(Math.floor(checkXPos), y, z) !== null) {
                    hitWallX = true;
                    break;
                }
            }
            if (hitWallX) break;
        }

        if (hitWallX) {
            nextPos.x = player.position.x;
        }
    }

    if (player.velocity.z !== 0) {
        const checkZPos = nextPos.z + (player.velocity.z > 0 ? player.radius : -player.radius);
        let hitWallZ = false;

        for (let y = Math.floor(nextPos.y); y <= Math.floor(nextPos.y + player.height - 0.1); y++) {
            for (let x = Math.floor(nextPos.x - player.radius); x <= Math.floor(nextPos.x + player.radius); x++) {
                if (getBlock(x, y, Math.floor(checkZPos)) !== null) {
                    hitWallZ = true;
                    break;
                }
            }
            if (hitWallZ) break;
        }

        if (hitWallZ) {
            nextPos.z = player.position.z;
        }
    }

    player.position.copy(nextPos);

    camera.position.copy(player.position);
    camera.position.y += player.height * 0.9;
    camera.rotation.copy(player.rotation);
}

// Raycasting for block interaction
export function raycastBlocks(camera) {
    const rayDirection = new THREE.Vector3();
    camera.getWorldDirection(rayDirection);

    const maxDistance = 5;
    const step = 0.1;

    for (let dist = 0; dist < maxDistance; dist += step) {
        const checkPos = camera.position.clone().add(rayDirection.clone().multiplyScalar(dist));
        const x = Math.floor(checkPos.x);
        const y = Math.floor(checkPos.y);
        const z = Math.floor(checkPos.z);

        if (getBlock(x, y, z) !== null) {
            const localPos = checkPos.clone().sub(new THREE.Vector3(x, y, z));
            let normal = new THREE.Vector3();

            const epsilon = 0.01;
            if (localPos.x < epsilon) normal.set(-1, 0, 0);
            else if (localPos.x > 1 - epsilon) normal.set(1, 0, 0);
            else if (localPos.y < epsilon) normal.set(0, -1, 0);
            else if (localPos.y > 1 - epsilon) normal.set(0, 1, 0);
            else if (localPos.z < epsilon) normal.set(0, 0, -1);
            else if (localPos.z > 1 - epsilon) normal.set(0, 0, 1);

            return {
                hit: true,
                position: new THREE.Vector3(x, y, z),
                normal: normal
            };
        }
    }

    return { hit: false };
}
