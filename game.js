// 1. Include the Three.js library
import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';

// 2. Get the canvas element
const canvas = document.getElementById('gameCanvas');

// 3. Create a THREE.Scene
const scene = new THREE.Scene();

// 4. Create a THREE.PerspectiveCamera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 5); // Position the camera slightly back and up

// 5. Create a THREE.WebGLRenderer and attach it to the canvas
const renderer = new THREE.WebGLRenderer({ canvas: canvas });
renderer.setSize(window.innerWidth, window.innerHeight);

// 6. Add a simple resize listener
window.addEventListener('resize', () => {
    // Update camera aspect ratio
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    // Update renderer size
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Create the ground plane
const groundGeometry = new THREE.PlaneGeometry(100, 100);
const groundMaterial = new THREE.MeshBasicMaterial({ color: 0x808080 }); // Gray color
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
scene.add(ground);

// 7. Create the player cube
const playerGeometry = new THREE.BoxGeometry(1, 1, 1); // Player size
const playerMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff }); // Player color (blue)
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.name = 'player'; // Name the mesh for easier identification
scene.add(player);

// Position the player
player.position.set(0, 0.5, 0); // Slightly above the origin

// Function to generate a random number in a range, excluding a central dead zone
function getRandomCoordinate(min, max, deadZoneRadius) {
    let coord;
    do {
        coord = Math.random() * (max - min) + min;
    } while (Math.abs(coord) < deadZoneRadius);
    return coord;
}

// Function to add a random cube
function addRandomCube() {
    const width = Math.random() * 1.5 + 0.5; // 0.5 to 2.0
    const height = Math.random() * 1.5 + 0.5; // 0.5 to 2.0
    const depth = Math.random() * 1.5 + 0.5; // 0.5 to 2.0
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshBasicMaterial({ color: Math.random() * 0xffffff });
    const cube = new THREE.Mesh(geometry, material);

    cube.position.x = getRandomCoordinate(-20, 20, 3); // Random X between -20 and 20, not within -3 to 3
    cube.position.z = getRandomCoordinate(-20, 20, 3); // Random Z between -20 and 20, not within -3 to 3
    cube.position.y = height / 2; // Position on the ground

    scene.add(cube);
}

// Function to add a random sphere
function addRandomSphere() {
    const radius = Math.random() * 1.0 + 0.5; // 0.5 to 1.5
    const geometry = new THREE.SphereGeometry(radius, 32, 32); // 32 segments for a smooth sphere
    const material = new THREE.MeshBasicMaterial({ color: Math.random() * 0xffffff });
    const sphere = new THREE.Mesh(geometry, material);

    sphere.position.x = getRandomCoordinate(-20, 20, 3); // Random X
    sphere.position.z = getRandomCoordinate(-20, 20, 3); // Random Z
    sphere.position.y = radius; // Position on the ground

    scene.add(sphere);
}

// Add some random cubes and spheres to the scene
for (let i = 0; i < 4; i++) {
    addRandomCube();
}
for (let i = 0; i < 3; i++) {
    addRandomSphere();
}

// Keyboard state and movement parameters
const keyboardState = {
    W: false, A: false, S: false, D: false, Q: false, E: false
};
const moveSpeed = 0.1;
const rotateSpeed = 0.05;

// Event listeners for keyboard input
window.addEventListener('keydown', (event) => {
    const key = event.key.toUpperCase();
    if (key in keyboardState) {
        keyboardState[key] = true;
    }
});

window.addEventListener('keyup', (event) => {
    const key = event.key.toUpperCase();
    if (key in keyboardState) {
        keyboardState[key] = false;
    }
});

// 8. Create a simple animation loop
function animate() {
    requestAnimationFrame(animate);

    // Player movement and rotation
    if (keyboardState.W) {
        player.translateZ(-moveSpeed);
    }
    if (keyboardState.S) {
        player.translateZ(moveSpeed);
    }
    if (keyboardState.A) {
        player.translateX(-moveSpeed);
    }
    if (keyboardState.D) {
        player.translateX(moveSpeed);
    }
    if (keyboardState.Q) {
        player.rotateY(rotateSpeed);
    }
    if (keyboardState.E) {
        player.rotateY(-rotateSpeed);
    }

    renderer.render(scene, camera);
}

animate();
