// Main entry point for the Urban Tank Warfare game

// Import modules
import { Scene } from './scene.js';
import { Tank } from './tank.js';
import { InputManager } from './input.js';
import { CameraController } from './camera.js';
import { Constants } from './constants.js';

// Game variables
let scene;
let inputManager;
let tank;
let cameraController;
let lastTime = 0;
let isLoading = true;

// DOM elements
const loadingScreen = document.getElementById('loading-screen');
const progressBar = document.querySelector('.progress-bar');
const gameCanvas = document.getElementById('gameCanvas');

/**
 * Initialize the game
 */
async function init() {
    // Update loading progress
    updateLoadingProgress(10, 'Initializing game...');
    
    // Initialize input manager first
    inputManager = new InputManager();
    updateLoadingProgress(20, 'Controls initialized');
    
    // Initialize scene
    scene = new Scene(gameCanvas);
    await scene.init();
    updateLoadingProgress(50, 'Scene loaded');
    
    // Create player tank
    const tankPosition = { x: 0, y: 0.5, z: 0 };
    tank = new Tank(scene, tankPosition, { x: 0, y: 0, z: 0 });
    updateLoadingProgress(70, 'Tank created');
    
    // Initialize camera controller
    cameraController = new CameraController(scene.getCamera(), tank);
    updateLoadingProgress(90, 'Camera configured');
    
    // Set up event listeners
    window.addEventListener('resize', handleResize);
    
    // Complete loading
    setTimeout(() => {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            isLoading = false;
        }, 500);
    }, 500);
    
    // Start game loop
    requestAnimationFrame(gameLoop);
}

/**
 * Main game loop
 */
function gameLoop(timestamp) {
    requestAnimationFrame(gameLoop);
    
    if (isLoading) return;
    
    // Calculate delta time in seconds
    const deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    
    // Skip large time gaps (e.g., when tab is inactive)
    if (deltaTime > 0.1) return;
    
    // Update game systems
    inputManager.update();
    
    // Process player input
    if (tank) {
        tank.handleInput(inputManager);
        tank.update(deltaTime);
    }
    
    // Update camera
    if (cameraController) {
        cameraController.update(deltaTime);
    }
    
    // Update and render scene
    if (scene) {
        scene.update(deltaTime);
    }
}

/**
 * Handle window resize
 */
function handleResize() {
    if (scene) {
        scene.resize(window.innerWidth, window.innerHeight);
    }
    
    if (cameraController) {
        cameraController.handleResize();
    }
}

/**
 * Update loading progress bar
 */
function updateLoadingProgress(percent, message) {
    progressBar.style.width = `${percent}%`;
    
    const loadingMessage = document.querySelector('#loading-screen p');
    if (loadingMessage && message) {
        loadingMessage.textContent = message;
    }
}

// Start the game
window.addEventListener('DOMContentLoaded', init);