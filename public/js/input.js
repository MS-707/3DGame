/**
 * Input management system for Urban Tank Warfare
 * Handles keyboard and mouse inputs
 */

export class InputManager {
    /**
     * Initialize the input manager
     */
    constructor() {
        // State tracking
        this.keys = {};
        this.mousePosition = null;
        this.mouseButtons = {};
        this.mouseDelta = { x: 0, y: 0 };
        this.prevMousePosition = null;
        
        // Set up event listeners
        this.setupEventListeners();
    }
    
    /**
     * Set up event listeners for keyboard and mouse
     */
    setupEventListeners() {
        // Keyboard events
        window.addEventListener('keydown', (event) => {
            this.keys[event.code] = true;
        });

        window.addEventListener('keyup', (event) => {
            delete this.keys[event.code];
        });

        // Mouse movement
        window.addEventListener('mousemove', (event) => {
            if (this.prevMousePosition) {
                this.mouseDelta = {
                    x: event.clientX - this.prevMousePosition.x,
                    y: event.clientY - this.prevMousePosition.y
                };
            }
            
            this.prevMousePosition = {
                x: event.clientX,
                y: event.clientY
            };
            
            this.mousePosition = {
                x: event.clientX,
                y: event.clientY
            };
        });
        
        // Mouse buttons
        window.addEventListener('mousedown', (event) => {
            this.mouseButtons[event.button] = true;
        });
        
        window.addEventListener('mouseup', (event) => {
            delete this.mouseButtons[event.button];
        });
        
        // Prevent context menu on right-click
        window.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
    }
    
    /**
     * Update input state each frame
     */
    update() {
        // Reset mouse delta after each frame
        this.mouseDelta = { x: 0, y: 0 };
    }
    
    /**
     * Check if a key is currently pressed
     * @param {string} keyCode - The key code to check
     * @returns {boolean} - True if the key is pressed
     */
    isKeyPressed(keyCode) {
        return !!this.keys[keyCode];
    }
    
    /**
     * Check if a mouse button is currently pressed
     * @param {number} button - Button index (0: left, 1: middle, 2: right)
     * @returns {boolean} - True if the button is pressed
     */
    isMouseButtonPressed(button) {
        return !!this.mouseButtons[button];
    }
    
    /**
     * Get the current mouse position
     * @returns {Object|null} - Mouse position {x, y} or null
     */
    getMousePosition() {
        return this.mousePosition;
    }
    
    /**
     * Get the mouse movement since last frame
     * @returns {Object} - Mouse delta {x, y}
     */
    getMouseDelta() {
        return this.mouseDelta;
    }
}