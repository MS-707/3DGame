/**
 * Scene management for Urban Tank Warfare
 * Handles 3D environment, lighting, and city layout
 */

// Import Three.js from CDN
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.146.1/build/three.module.js';

/**
 * Initialize the scene with all components
 * @param {HTMLCanvasElement} canvas - The canvas element for rendering
 * @returns {Array} - Array containing [scene, camera]
 */
export function initScene(canvas) {
    const scene = new THREE.Scene();

    // Set up camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(20, 20, 30);
    camera.lookAt(0, 0, 0);

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    // Add directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 30);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);

    // Ground plane with grid texture
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x333333,
        roughness: 0.8,
        metalness: 0.2
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    
    // Add grid helper for visual reference
    const gridHelper = new THREE.GridHelper(200, 40, 0x444444, 0x888888);
    scene.add(gridHelper);

    // Create city environment
    createCity(scene);

    return [scene, camera];
}

/**
 * Create buildings for the city environment
 * @param {THREE.Scene} scene - The Three.js scene
 */
function createCity(scene) {
    // City parameters
    const citySize = 100;
    const blockSize = 20;
    const buildingColors = [
        0x8A8A8A, 0x787878, 0x696969, 
        0x909090, 0xA0A0A0, 0xB0B0B0
    ];

    // Create buildings in a grid pattern
    for (let x = -citySize/2; x < citySize/2; x += blockSize) {
        for (let z = -citySize/2; z < citySize/2; z += blockSize) {
            // Skip center area for player spawn
            if (Math.abs(x) < 20 && Math.abs(z) < 20) continue;
            
            // Create 1-3 buildings per block
            const buildingsPerBlock = 1 + Math.floor(Math.random() * 3);
            
            for (let i = 0; i < buildingsPerBlock; i++) {
                // Random building properties
                const width = 5 + Math.random() * 8;
                const height = 10 + Math.random() * 30;
                const depth = 5 + Math.random() * 8;
                
                // Create building geometry and material
                const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
                const colorIndex = Math.floor(Math.random() * buildingColors.length);
                const buildingMaterial = new THREE.MeshStandardMaterial({ 
                    color: buildingColors[colorIndex],
                    roughness: 0.7,
                    metalness: 0.2
                });
                
                // Create building mesh
                const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
                
                // Position within the block (with some randomness)
                const offsetX = (Math.random() - 0.5) * (blockSize - width);
                const offsetZ = (Math.random() - 0.5) * (blockSize - depth);
                
                building.position.set(
                    x + offsetX, 
                    height / 2, 
                    z + offsetZ
                );
                
                // Add shadows
                building.castShadow = true;
                building.receiveShadow = true;
                
                // Add to scene
                scene.add(building);
            }
        }
    }
}

/**
 * Update scene objects (animations, physics, etc.)
 * @param {number} deltaTime - Time since last frame in seconds
 */
export function updateScene(deltaTime) {
    // Update any animated scene objects here
    // Currently empty as initial scene has no animations
}

/**
 * Handle window resize
 * @param {THREE.Camera} camera - The camera to update
 * @param {THREE.WebGLRenderer} renderer - The renderer to resize
 */
export function handleResize(camera, renderer) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}