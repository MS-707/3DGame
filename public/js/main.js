/**
 * Main entry point for Urban Tank Warfare
 */

import { Game } from './game.js';

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create and initialize game
    window.game = new Game();
    
    // Log game controls to console
    console.log(`
    Urban Tank Warfare - Controls
    ----------------------------
    Movement: WASD
    Aim: Mouse
    Fire: Spacebar or Left Mouse Button
    
    Camera Modes:
    1: Follow Camera
    2: Overhead Camera
    3: First Person
    4: Cinematic Mode
    
    Other Controls:
    F: Toggle Fullscreen
    V: Toggle FPS Display
    P/ESC: Pause Game
    
    Multiplayer Mode: 
    Add ?multiplayer to the URL to enable multiplayer mode
    `);
});