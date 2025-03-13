/**
 * Main game initialization and loop for Urban Tank Warfare
 * This is the primary entry point that ties all components together
 */

import { Scene } from './scene.js';
import { Tank } from './tank.js';
import { InputManager } from './input.js';
import { CameraController } from './camera.js';
import { setupNetworking } from './network-integration.js';
import { Constants } from './constants.js';

// Game class to manage all components
export class Game {
    /**
     * Initialize the game
     */
    constructor() {
        // Core game properties
        this.canvas = document.getElementById('gameCanvas');
        this.scene = null;
        this.inputManager = null;
        this.playerTank = null;
        this.cameraController = null;
        this.networkManager = null;
        
        // Game state
        this.isRunning = false;
        this.lastFrameTime = 0;
        this.fps = 0;
        this.deltaTime = 0;
        
        // UI elements
        this.uiElements = {
            healthBar: null,
            ammoCounter: null,
            fpsCounter: null
        };
        
        // Debug options
        this.debug = {
            showFps: true,
            drawColliders: false
        };
        
        // Bind methods
        this.gameLoop = this.gameLoop.bind(this);
        
        // Initialize game on creation
        this.init();
    }
    
    /**
     * Initialize the game components
     */
    async init() {
        console.log('Initializing game...');
        
        // Show loading screen
        this.updateLoadingProgress(10, 'Initializing game...');
        
        // Initialize input manager
        this.inputManager = new InputManager();
        this.updateLoadingProgress(20, 'Controls initialized');
        
        // Initialize scene
        this.scene = new Scene(this.canvas);
        await this.scene.init();
        this.updateLoadingProgress(40, 'Scene loaded');
        
        // Create player tank
        const tankPosition = { x: 0, y: 1, z: 0 };
        this.playerTank = new Tank(this.scene, tankPosition);
        this.updateLoadingProgress(60, 'Tank created');
        
        // Initialize camera controller
        this.cameraController = new CameraController(this.scene.getCamera(), this.playerTank);
        this.updateLoadingProgress(70, 'Camera configured');
        
        // Setup network manager (if multiplayer)
        if (this.isMultiplayer()) {
            this.networkManager = setupNetworking(this.scene, this.playerTank, this.inputManager);
            this.updateLoadingProgress(90, 'Network initialized');
        }
        
        // Create UI elements
        this.createUI();
        this.updateLoadingProgress(95, 'UI created');
        
        // Listen for keyboard shortcuts
        window.addEventListener('keydown', this.handleShortcuts.bind(this));
        
        // Start game loop
        this.isRunning = true;
        requestAnimationFrame(this.gameLoop);
        
        // Complete loading
        this.finishLoading();
        
        console.log('Game initialized successfully');
    }
    
    /**
     * Main game loop
     */
    gameLoop(timestamp) {
        // Calculate delta time
        if (this.lastFrameTime === 0) {
            this.lastFrameTime = timestamp;
        }
        this.deltaTime = (timestamp - this.lastFrameTime) / 1000; // in seconds
        this.lastFrameTime = timestamp;
        
        // Skip large time gaps (e.g., when tab is inactive)
        if (this.deltaTime > 0.1) {
            this.deltaTime = 0.016; // Use a default of ~60fps
        }
        
        // Update FPS counter
        this.fps = 1 / this.deltaTime;
        if (this.debug.showFps && this.uiElements.fpsCounter) {
            this.uiElements.fpsCounter.textContent = `FPS: ${Math.round(this.fps)}`;
        }
        
        // Process input
        this.inputManager.update();
        
        // Handle camera mode switching
        this.handleCameraControls();
        
        // Update player tank
        if (this.playerTank) {
            this.playerTank.handleInput(this.inputManager);
            this.playerTank.update(this.deltaTime);
            
            // Update UI
            this.updateUI();
        }
        
        // Update camera
        if (this.cameraController) {
            this.cameraController.update(this.deltaTime);
        }
        
        // Update scene
        if (this.scene) {
            this.scene.update(this.deltaTime);
        }
        
        // Continue game loop if running
        if (this.isRunning) {
            requestAnimationFrame(this.gameLoop);
        }
    }
    
    /**
     * Handle camera control shortcuts
     */
    handleCameraControls() {
        // Camera mode switching
        if (this.inputManager.isKeyDown('Digit1')) {
            this.cameraController.setMode('follow');
            this.showMessage('Camera Mode: Follow');
        } else if (this.inputManager.isKeyDown('Digit2')) {
            this.cameraController.setMode('overhead');
            this.showMessage('Camera Mode: Overhead');
        } else if (this.inputManager.isKeyDown('Digit3')) {
            this.cameraController.setMode('first-person');
            this.showMessage('Camera Mode: First Person');
        } else if (this.inputManager.isKeyDown('Digit4')) {
            this.cameraController.setMode('cinematic');
            this.showMessage('Camera Mode: Cinematic');
        }
    }
    
    /**
     * Handle keyboard shortcuts
     */
    handleShortcuts(event) {
        // Fullscreen toggle (F)
        if (event.code === 'KeyF') {
            this.toggleFullscreen();
        }
        
        // FPS counter toggle (V)
        if (event.code === 'KeyV') {
            this.debug.showFps = !this.debug.showFps;
            if (this.uiElements.fpsCounter) {
                this.uiElements.fpsCounter.style.display = this.debug.showFps ? 'block' : 'none';
            }
        }
        
        // Pause game (P or Escape)
        if (event.code === 'KeyP' || event.code === 'Escape') {
            this.togglePause();
        }
    }
    
    /**
     * Update loading progress
     * @param {number} percent - Loading progress (0-100)
     * @param {string} message - Status message
     */
    updateLoadingProgress(percent, message) {
        const progressBar = document.querySelector('.progress-bar');
        const loadingMessage = document.querySelector('#loading-screen p');
        
        if (progressBar) {
            progressBar.style.width = `${percent}%`;
        }
        
        if (loadingMessage && message) {
            loadingMessage.textContent = message;
        }
    }
    
    /**
     * Complete loading and hide loading screen
     */
    finishLoading() {
        this.updateLoadingProgress(100, 'Loading complete!');
        
        // Fade out loading screen
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }
    }
    
    /**
     * Create UI elements
     */
    createUI() {
        // Create UI container
        const uiContainer = document.createElement('div');
        uiContainer.className = 'ui-container';
        document.body.appendChild(uiContainer);
        
        // Health bar
        const healthContainer = document.createElement('div');
        healthContainer.className = 'health-container';
        
        const healthLabel = document.createElement('div');
        healthLabel.className = 'health-label';
        healthLabel.textContent = 'HEALTH';
        
        const healthBarContainer = document.createElement('div');
        healthBarContainer.className = 'health-bar-container';
        
        this.uiElements.healthBar = document.createElement('div');
        this.uiElements.healthBar.className = 'health-bar';
        
        healthBarContainer.appendChild(this.uiElements.healthBar);
        healthContainer.appendChild(healthLabel);
        healthContainer.appendChild(healthBarContainer);
        uiContainer.appendChild(healthContainer);
        
        // Ammo counter
        const ammoContainer = document.createElement('div');
        ammoContainer.className = 'ammo-container';
        
        const ammoLabel = document.createElement('div');
        ammoLabel.className = 'ammo-label';
        ammoLabel.textContent = 'AMMO';
        
        this.uiElements.ammoCounter = document.createElement('div');
        this.uiElements.ammoCounter.className = 'ammo-counter';
        this.uiElements.ammoCounter.textContent = '∞';
        
        ammoContainer.appendChild(ammoLabel);
        ammoContainer.appendChild(this.uiElements.ammoCounter);
        uiContainer.appendChild(ammoContainer);
        
        // FPS counter
        this.uiElements.fpsCounter = document.createElement('div');
        this.uiElements.fpsCounter.className = 'fps-counter';
        this.uiElements.fpsCounter.textContent = 'FPS: 0';
        this.uiElements.fpsCounter.style.display = this.debug.showFps ? 'block' : 'none';
        uiContainer.appendChild(this.uiElements.fpsCounter);
        
        // Message box (for temporary messages)
        const messageBox = document.createElement('div');
        messageBox.className = 'message-box';
        messageBox.style.display = 'none';
        uiContainer.appendChild(messageBox);
        this.uiElements.messageBox = messageBox;
        
        // Add UI styles
        this.addUIStyles();
    }
    
    /**
     * Add UI styles to the document
     */
    addUIStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .ui-container {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 100;
            }
            
            .health-container {
                position: absolute;
                bottom: 30px;
                left: 30px;
                display: flex;
                flex-direction: column;
                align-items: flex-start;
            }
            
            .health-label {
                color: white;
                font-family: Arial, sans-serif;
                font-size: 14px;
                margin-bottom: 5px;
                text-shadow: 0 0 3px #000;
            }
            
            .health-bar-container {
                width: 200px;
                height: 15px;
                background-color: rgba(0, 0, 0, 0.5);
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 3px;
                overflow: hidden;
            }
            
            .health-bar {
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, #f00, #f70);
                transition: width 0.3s ease;
            }
            
            .ammo-container {
                position: absolute;
                bottom: 30px;
                right: 30px;
                display: flex;
                flex-direction: column;
                align-items: flex-end;
            }
            
            .ammo-label {
                color: white;
                font-family: Arial, sans-serif;
                font-size: 14px;
                margin-bottom: 5px;
                text-shadow: 0 0 3px #000;
            }
            
            .ammo-counter {
                color: white;
                font-family: Arial, sans-serif;
                font-size: 24px;
                text-shadow: 0 0 5px #000;
            }
            
            .fps-counter {
                position: absolute;
                top: 10px;
                left: 10px;
                color: white;
                font-family: monospace;
                font-size: 12px;
                background-color: rgba(0, 0, 0, 0.5);
                padding: 5px;
                border-radius: 3px;
            }
            
            .message-box {
                position: absolute;
                top: 80px;
                left: 50%;
                transform: translateX(-50%);
                background-color: rgba(0, 0, 0, 0.7);
                color: white;
                font-family: Arial, sans-serif;
                padding: 10px 20px;
                border-radius: 5px;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
        `;
        document.head.appendChild(style);
    }
    
    /**
     * Update UI elements
     */
    updateUI() {
        // Update health bar
        if (this.uiElements.healthBar && this.playerTank) {
            const healthPercent = (this.playerTank.health / this.playerTank.maxHealth) * 100;
            this.uiElements.healthBar.style.width = `${healthPercent}%`;
            
            // Change color based on health
            if (healthPercent < 25) {
                this.uiElements.healthBar.style.background = 'red';
            } else if (healthPercent < 50) {
                this.uiElements.healthBar.style.background = 'linear-gradient(90deg, #f00, #f70)';
            } else {
                this.uiElements.healthBar.style.background = 'linear-gradient(90deg, #0f0, #7f0)';
            }
        }
        
        // Update ammo counter
        if (this.uiElements.ammoCounter && this.playerTank && this.playerTank.ammo !== undefined) {
            this.uiElements.ammoCounter.textContent = this.playerTank.ammo;
        }
    }
    
    /**
     * Show a temporary message
     * @param {string} message - Message to display
     * @param {number} duration - Display duration in ms (default: 2000ms)
     */
    showMessage(message, duration = 2000) {
        if (!this.uiElements.messageBox) return;
        
        // Set message text
        this.uiElements.messageBox.textContent = message;
        
        // Show message
        this.uiElements.messageBox.style.display = 'block';
        this.uiElements.messageBox.style.opacity = '1';
        
        // Clear any existing timeout
        if (this.messageTimeout) {
            clearTimeout(this.messageTimeout);
        }
        
        // Hide message after duration
        this.messageTimeout = setTimeout(() => {
            this.uiElements.messageBox.style.opacity = '0';
            setTimeout(() => {
                this.uiElements.messageBox.style.display = 'none';
            }, 300);
        }, duration);
    }
    
    /**
     * Toggle fullscreen mode
     */
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }
    
    /**
     * Toggle pause state
     */
    togglePause() {
        this.isRunning = !this.isRunning;
        
        if (this.isRunning) {
            // Resume game
            this.lastFrameTime = performance.now();
            requestAnimationFrame(this.gameLoop);
            this.showMessage('Game Resumed');
        } else {
            // Pause game
            this.showMessage('Game Paused', 0); // 0 duration means don't auto-hide
        }
    }
    
    /**
     * Check if game is in multiplayer mode
     * @returns {boolean} - True if multiplayer
     */
    isMultiplayer() {
        // Check URL parameters for multiplayer flag
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.has('multiplayer');
    }
}