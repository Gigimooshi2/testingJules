// 1. Include the Three.js library
import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';

// 2. Get the canvas element
const canvas = document.getElementById('gameCanvas');

// HP System Elements and Variables
const hpBarElement = document.getElementById('hp-bar');
const hpTextElement = document.getElementById('hp-text');
const gameOverMessageElement = document.getElementById('game-over-message');

let playerMaxHP = 100;
let playerCurrentHP = 100;
let isGameOver = false;

// Score System Elements and Variables
const scoreValueElement = document.getElementById('score-value');
let score = 0;

// XP and Leveling System Elements and Variables
const levelValueElement = document.getElementById('level-value');
const xpValueElement = document.getElementById('xp-value');
const xpNextLevelValueElement = document.getElementById('xp-next-level-value');
let playerLevel = 1;
let playerXP = 0;
const xpPerLevel = [0, 100, 200, 300, 500, 700, 1000]; // xpPerLevel[0] is unused, xpPerLevel[1] is for level 1 to 2
let levelUpOccurred = false; // Flag for level up choice later

// Level-Up Power-up Choice System
const levelUpChoiceContainer = document.getElementById('level-up-choice-container');
const powerUpOptionsDiv = document.getElementById('power-up-options');
let isGamePaused = false;

const availablePowerUps = [
    { id: "speed", name: "Speed Boost", description: "Increases movement speed by 10%.", apply: function() { moveSpeed *= 1.10; console.log("Speed increased to: " + moveSpeed); } },
    { id: "jump", name: "Jump Higher", description: "Increases jump strength by 15%.", apply: function() { jumpStrength *= 1.15; console.log("Jump strength increased to: " + jumpStrength); } },
    { id: "hpBoost", name: "Max HP Up", description: "Increases Max HP by 20.", apply: function() { playerMaxHP += 20; playerCurrentHP += 20; updateHPDisplay(); console.log("Max HP increased to: " + playerMaxHP); } },
    { id: "regen", name: "Quick Heal", description: "Instantly heals 30 HP.", apply: function() { playerCurrentHP = Math.min(playerCurrentHP + 30, playerMaxHP); updateHPDisplay(); console.log("Healed. Current HP: " + playerCurrentHP); } },
    { id: "xpGain", name: "XP Bonus", description: "Gain 50 XP instantly.", apply: function() { playerXP += 50; /* updateLevelDisplay will handle showing this */ console.log("Gained 50 XP."); } }
];
let presentedPowerUpChoices = []; // To store the 3 choices given to player

// Function to update Level and XP display
function updateLevelDisplay() {
    levelValueElement.textContent = playerLevel;
    xpValueElement.textContent = playerXP;
    xpNextLevelValueElement.textContent = xpPerLevel[playerLevel] || 'Max'; // Handle max level
}

// Initial Level and XP display update
updateLevelDisplay();

// Camera offset for third-person view
const cameraOffset = new THREE.Vector3(0, 3, 7); // X:0 (center behind), Y:3 (height), Z:7 (distance)

// Function to update Score display
function updateScoreDisplay() {
    scoreValueElement.textContent = score;
}

// Initial Score display update
updateScoreDisplay();

// Function to update HP display
function updateHPDisplay() {
    const hpPercentage = (playerCurrentHP / playerMaxHP) * 100;
    hpBarElement.style.width = hpPercentage + '%';
    hpTextElement.textContent = `${playerCurrentHP}/${playerMaxHP} HP`;
}

// Initial HP display update
updateHPDisplay();

// --- Level-Up Power-up Choice Functions ---
function presentLevelUpChoices() {
    isGamePaused = true;
    levelUpChoiceContainer.style.display = 'flex'; // Or 'block'
    powerUpOptionsDiv.innerHTML = ''; // Clear previous options
    presentedPowerUpChoices = [];

    // Shuffle availablePowerUps to get a random selection
    const shuffledPowerUps = [...availablePowerUps].sort(() => 0.5 - Math.random());
    
    // Select up to 3 distinct power-ups
    const numChoices = Math.min(3, shuffledPowerUps.length);
    for (let i = 0; i < numChoices; i++) {
        presentedPowerUpChoices.push(shuffledPowerUps[i]);
    }

    presentedPowerUpChoices.forEach((powerUp, index) => {
        const choiceButton = document.createElement('button');
        choiceButton.style.display = 'block';
        choiceButton.style.margin = '10px auto';
        choiceButton.style.padding = '10px';
        choiceButton.style.fontSize = '16px';
        choiceButton.innerHTML = `<strong>${powerUp.name}</strong><br><small>${powerUp.description}</small>`;
        choiceButton.onclick = function() { // Use a function wrapper to pass index
            applyPowerUpChoice(index);
            hideLevelUpChoices();
        };
        powerUpOptionsDiv.appendChild(choiceButton);
    });
}

function applyPowerUpChoice(choiceIndex) {
    if (choiceIndex < 0 || choiceIndex >= presentedPowerUpChoices.length) {
        console.error("Invalid power-up choice index:", choiceIndex);
        return;
    }
    const powerUp = presentedPowerUpChoices[choiceIndex];
    if (powerUp && typeof powerUp.apply === 'function') {
        powerUp.apply();
    } else {
        console.error("Chosen power-up or its apply method is invalid:", powerUp);
    }
    presentedPowerUpChoices = []; // Clear choices
}

function hideLevelUpChoices() {
    levelUpChoiceContainer.style.display = 'none';
    isGamePaused = false;
    levelUpOccurred = false; // Reset the flag
}
// --- End Level-Up Functions ---

// 3. Create a THREE.Scene
const scene = new THREE.Scene();

// 4. Create a THREE.PerspectiveCamera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// camera.position.set(0, 2, 5); // This will be replaced by dynamic initial positioning

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

let enemies = [];
let powerUps = [];

// Position the player
player.position.set(0, 0.5, 0); // Slightly above the origin

// Initial camera position based on player
const initialCameraPosition = player.position.clone().add(
    cameraOffset.clone().applyQuaternion(player.quaternion)
);
camera.position.copy(initialCameraPosition);
camera.lookAt(player.position.clone().add(new THREE.Vector3(0, 0.5, 0)));

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

// Function to spawn an enemy
function spawnEnemy(x, y, z) {
    const enemyGeometry = new THREE.BoxGeometry(1, 1, 1); // Enemy size
    const enemyMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Enemy color (red)
    const enemy = new THREE.Mesh(enemyGeometry, enemyMaterial);
    enemy.position.set(x, y, z);
    scene.add(enemy);
    enemies.push(enemy);
}

// Spawn initial enemies
spawnEnemy(5, 0.5, 5);
spawnEnemy(-5, 0.5, -5);
spawnEnemy(5, 0.5, -5);

// Function to spawn an HP Power-up
function spawnHPPowerUp(x, y, z) {
    const powerUpRadius = 0.5;
    const powerUpGeometry = new THREE.SphereGeometry(powerUpRadius, 16, 16); // Green sphere
    const powerUpMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const powerUp = new THREE.Mesh(powerUpGeometry, powerUpMaterial);
    powerUp.position.set(x, y, z);
    powerUp.type = 'hp'; // Assign type for identification
    scene.add(powerUp);
    powerUps.push(powerUp);
}

// Spawn initial HP Power-ups
spawnHPPowerUp(3, 0.5, -3);
spawnHPPowerUp(-3, 0.5, 3);

// Function to check for collisions between player and enemies
function checkCollisions() {
    if (isGameOver) return; // Don't check collisions if game is over

    const playerSize = 1; // Assuming player is 1x1x1
    const enemySize = 1;  // Assuming enemies are 1x1x1
    const collisionThreshold = (playerSize / 2) + (enemySize / 2); // = 1.0

    for (const enemy of enemies) { // Changed to for...of to allow early return
        if (
            Math.abs(player.position.x - enemy.position.x) < collisionThreshold &&
            Math.abs(player.position.y - enemy.position.y) < collisionThreshold &&
            Math.abs(player.position.z - enemy.position.z) < collisionThreshold
        ) {
            playerCurrentHP -= 20; // Decrease HP by 20
            updateHPDisplay();
            console.log("Player collided with an enemy! HP: " + playerCurrentHP);

            // If HP drops to 0 or below, game over logic will be handled in animate()
            // For now, just return to prevent further damage this frame from other enemies
            return;
        }
    }
}

// Function to check for collisions between player and HP power-ups
function checkPowerUpCollisions() {
    if (isGameOver) return;

    const playerSize = 1;    // Player is 1x1x1 cube
    const powerUpRadius = 0.5; // Power-up is a sphere with radius 0.5
    // Effective collision distance: player's half-size + power-up's radius
    const collisionThreshold = (playerSize / 2) + powerUpRadius; // 0.5 + 0.5 = 1.0

    for (let i = powerUps.length - 1; i >= 0; i--) {
        const powerUp = powerUps[i];

        if (
            Math.abs(player.position.x - powerUp.position.x) < collisionThreshold &&
            Math.abs(player.position.y - powerUp.position.y) < collisionThreshold && // Y-axis check is important
            Math.abs(player.position.z - powerUp.position.z) < collisionThreshold
        ) {
            if (powerUp.type === 'hp') {
                playerCurrentHP += 30;
                if (playerCurrentHP > playerMaxHP) {
                    playerCurrentHP = playerMaxHP;
                }
                updateHPDisplay();

                score += 10; // Add 10 points for collecting an HP power-up
                updateScoreDisplay();
                console.log("Score: " + score); // Optional: for debugging

                if (!isGameOver) { // Only gain XP if not game over
                    playerXP += 50; // Grant 25 XP for an HP power-up
                    console.log("XP: " + playerXP); 
                    // updateLevelDisplay(); // We'll call this after checking for level up
                }

                scene.remove(powerUp);
                powerUps.splice(i, 1);
                console.log("Collected HP Power-up! HP: " + playerCurrentHP);
                return; // Prevent multiple power-up pickups in the same frame
            }
        }
    }
}

// Keyboard state and movement parameters
const keyboardState = {
    W: false, A: false, S: false, D: false, Q: false, E: false
};
let moveSpeed = 0.1; // Changed to let
const rotateSpeed = 0.05;

// Jump physics variables
const gravity = 0.02;
let jumpStrength = 0.5; // Changed to let // Initial upward velocity when jumping
let playerOnGround = true;
let playerVelocityY = 0;

// Event listeners for keyboard input
window.addEventListener('keydown', (event) => {
    const key = event.key.toUpperCase();
    if (key in keyboardState) {
        keyboardState[key] = true;
    }

    // Handle jump
    if (event.code === 'Space' && playerOnGround) {
        playerVelocityY = jumpStrength;
        playerOnGround = false;
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
    if (isGamePaused) {
        requestAnimationFrame(animate); // Keep the loop running to allow unpausing
        return;
    }
    if (isGameOver) {
        return; // Stop game updates if game over
    }
    requestAnimationFrame(animate);

    if (!isGameOver && !isGamePaused) { // Modified to include !isGamePaused
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

    // Apply gravity
    if (!playerOnGround) {
        playerVelocityY -= gravity;
    }
    player.position.y += playerVelocityY;

    // Check for ground collision
    if (player.position.y <= 0.5) { // Assuming player height is 1, so center is 0.5 above ground
        player.position.y = 0.5;
        playerVelocityY = 0;
        playerOnGround = true;
    } else {
        playerOnGround = false;
    }
} // End of game active block (if !isGameOver)

    checkCollisions(); // Check for player-enemy collisions
    checkPowerUpCollisions(); // Check for player-powerup collisions

    // Level Up Logic
    if (!isGameOver && xpPerLevel[playerLevel] !== undefined && playerXP >= xpPerLevel[playerLevel] && playerLevel < xpPerLevel.length -1) { // Check if there's a next level defined and not beyond max
        playerXP -= xpPerLevel[playerLevel]; // Subtract XP needed for current level, carry over excess
        playerLevel++;
        levelUpOccurred = true; // Set flag for power-up choice step
        console.log("Level Up! Reached Level: " + playerLevel);
        // alert("Level Up! Reached Level: " + playerLevel); // Temporary notification
        presentLevelUpChoices(); // Present choices to the player
    }
    // Always update display, regardless of level up, to show XP changes
    updateLevelDisplay(); 

    // Game Over Check
    if (playerCurrentHP <= 0 && !isGameOver) {
        isGameOver = true;
        playerCurrentHP = 0; // Ensure HP doesn't go negative in display
        updateHPDisplay(); // Update display one last time
        gameOverMessageElement.style.display = 'block'; // Show "GAME OVER"
        // Disable player controls
        Object.keys(keyboardState).forEach(key => keyboardState[key] = false); // Stop movement
    }

    // Update camera to follow player (third-person)
    if (player && cameraOffset) { // Ensure player and offset are defined
        // Calculate desired camera position
        const desiredCameraPosition = player.position.clone().add(
            cameraOffset.clone().applyQuaternion(player.quaternion)
        );

        // Smoothly interpolate camera position (Lerp)
        camera.position.lerp(desiredCameraPosition, 0.1); // Adjust 0.1 for faster/slower follow

        // Make camera look at the player's center
        const lookAtPosition = player.position.clone().add(new THREE.Vector3(0, 0.5, 0));
        camera.lookAt(lookAtPosition);
    }

    renderer.render(scene, camera);
}

animate();
