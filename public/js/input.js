/**
 * Input management system for Urban Tank Warfare
 * Handles keyboard and mouse inputs with support for key rebinding
 */

export class InputManager {
    /**
     * Initialize the input manager
     */
    constructor() {
        // Current and previous states for detecting state changes
        this.keyStates = {};
        this.prevKeyStates = {};
        this.mouseState = { x: 0, y: 0, buttons: {} };
        this.prevMouseState = { x: 0, y: 0, buttons: {} };
        
        // Normalized analog input values
        this.axisStates = {
            horizontal: 0,
            vertical: 0,
            mouseX: 0,
            mouseY: 0
        };
        
        // Key bindings with both key codes and key names for better usability
        this.keyBindings = {
            moveForward: { code: 'KeyW', keyCode: 87 },
            moveBackward: { code: 'KeyS', keyCode: 83 },
            moveLeft: { code: 'KeyA', keyCode: 65 },
            moveRight: { code: 'KeyD', keyCode: 68 },
            firePrimary: { code: 'Space', keyCode: 32 },
            fireSecondary: { mouseButton: 2 }, // Right mouse button
            boost: { code: 'ShiftLeft', keyCode: 16 },
            reload: { code: 'KeyR', keyCode: 82 }
        };
        
        // Input configuration
        this.config = {
            mouseSensitivity: 1.0,
            deadzone: 0.1,      // Ignore small inputs to prevent drift
            smoothing: 0.2,     // Input smoothing factor (0-1)
            invertY: false,     // Invert mouse Y axis
            invertX: false      // Invert mouse X axis
        };
        
        // For tracking mouse movement
        this.mouseDelta = { x: 0, y: 0 };
        
        // For touch support
        this.touchState = {};
        this.hasTouchEvents = false;
        
        // Automatically initialize
        this.init();
    }
    
    /**
     * Initialize event listeners
     */
    init() {
        // Keyboard events
        window.addEventListener('keydown', this.onKeyDown.bind(this), false);
        window.addEventListener('keyup', this.onKeyUp.bind(this), false);
        
        // Mouse events
        window.addEventListener('mousemove', this.onMouseMove.bind(this), false);
        window.addEventListener('mousedown', this.onMouseDown.bind(this), false);
        window.addEventListener('mouseup', this.onMouseUp.bind(this), false);
        
        // Prevent context menu on right-click
        window.addEventListener('contextmenu', (e) => e.preventDefault(), false);
        
        // Touch events for mobile support
        window.addEventListener('touchstart', this.onTouchStart.bind(this), false);
        window.addEventListener('touchmove', this.onTouchMove.bind(this), false);
        window.addEventListener('touchend', this.onTouchEnd.bind(this), false);
        
        // Pointer lock for better mouse control (optional)
        document.addEventListener('pointerlockchange', this.onPointerLockChange.bind(this), false);
        
        // Load saved settings if available
        this.loadSettings();
        
        console.log('Input manager initialized');
    }
    
    /**
     * Update input states (call once per frame)
     */
    update() {
        // Copy current states to previous states
        this.prevKeyStates = {...this.keyStates};
        this.prevMouseState = {
            x: this.mouseState.x,
            y: this.mouseState.y,
            buttons: {...this.mouseState.buttons}
        };
        
        // Calculate analog axis values from keyboard inputs
        let targetHorizontal = 0;
        let targetVertical = 0;
        
        // Horizontal axis (left/right)
        if (this.isKeyPressed(this.keyBindings.moveLeft.code) || 
            this.isKeyPressed(this.keyBindings.moveLeft.keyCode)) {
            targetHorizontal -= 1;
        }
        if (this.isKeyPressed(this.keyBindings.moveRight.code) || 
            this.isKeyPressed(this.keyBindings.moveRight.keyCode)) {
            targetHorizontal += 1;
        }
        
        // Vertical axis (forward/backward)
        if (this.isKeyPressed(this.keyBindings.moveForward.code) || 
            this.isKeyPressed(this.keyBindings.moveForward.keyCode)) {
            targetVertical += 1;
        }
        if (this.isKeyPressed(this.keyBindings.moveBackward.code) || 
            this.isKeyPressed(this.keyBindings.moveBackward.keyCode)) {
            targetVertical -= 1;
        }
        
        // Apply smoothing to analog inputs
        this.axisStates.horizontal = this.smoothValue(this.axisStates.horizontal, targetHorizontal);
        this.axisStates.vertical = this.smoothValue(this.axisStates.vertical, targetVertical);
        
        // Normalize diagonal movement
        if (this.axisStates.horizontal !== 0 && this.axisStates.vertical !== 0) {
            const magnitude = Math.sqrt(
                this.axisStates.horizontal * this.axisStates.horizontal + 
                this.axisStates.vertical * this.axisStates.vertical
            );
            
            if (magnitude > 1) {
                this.axisStates.horizontal /= magnitude;
                this.axisStates.vertical /= magnitude;
            }
        }
        
        // Apply deadzone
        if (Math.abs(this.axisStates.horizontal) < this.config.deadzone) {
            this.axisStates.horizontal = 0;
        }
        if (Math.abs(this.axisStates.vertical) < this.config.deadzone) {
            this.axisStates.vertical = 0;
        }
        
        // Update mouse delta for this frame
        this.axisStates.mouseX = this.mouseDelta.x * this.config.mouseSensitivity;
        this.axisStates.mouseY = this.mouseDelta.y * this.config.mouseSensitivity;
        
        // Apply inversion if configured
        if (this.config.invertX) {
            this.axisStates.mouseX *= -1;
        }
        if (this.config.invertY) {
            this.axisStates.mouseY *= -1;
        }
        
        // Reset mouse delta after using it
        this.mouseDelta = { x: 0, y: 0 };
    }
    
    /**
     * Smoothly interpolate between current and target values
     * @param {number} current - Current value
     * @param {number} target - Target value
     * @returns {number} - Smoothed value
     */
    smoothValue(current, target) {
        return current + (target - current) * this.config.smoothing;
    }
    
    /**
     * Handle keydown events
     * @param {KeyboardEvent} event - Keyboard event
     */
    onKeyDown(event) {
        // Store both key code and code for flexibility
        this.keyStates[event.keyCode] = true;
        this.keyStates[event.code] = true;
    }
    
    /**
     * Handle keyup events
     * @param {KeyboardEvent} event - Keyboard event
     */
    onKeyUp(event) {
        // Remove both key code and code
        delete this.keyStates[event.keyCode];
        delete this.keyStates[event.code];
    }
    
    /**
     * Handle mouse movement
     * @param {MouseEvent} event - Mouse event
     */
    onMouseMove(event) {
        // Store absolute position
        this.mouseState.x = event.clientX;
        this.mouseState.y = event.clientY;
        
        // Calculate delta movement (for camera control)
        if (document.pointerLockElement) {
            // If pointer is locked, use movementX/Y for more accurate tracking
            this.mouseDelta.x += event.movementX || 0;
            this.mouseDelta.y += event.movementY || 0;
        } else {
            // Fallback for browsers without pointer lock
            const deltaX = this.mouseState.x - this.prevMouseState.x;
            const deltaY = this.mouseState.y - this.prevMouseState.y;
            this.mouseDelta.x += deltaX;
            this.mouseDelta.y += deltaY;
        }
    }
    
    /**
     * Handle mouse button press
     * @param {MouseEvent} event - Mouse event
     */
    onMouseDown(event) {
        this.mouseState.buttons[event.button] = true;
    }
    
    /**
     * Handle mouse button release
     * @param {MouseEvent} event - Mouse event
     */
    onMouseUp(event) {
        delete this.mouseState.buttons[event.button];
    }
    
    /**
     * Handle touch start
     * @param {TouchEvent} event - Touch event
     */
    onTouchStart(event) {
        event.preventDefault();
        this.hasTouchEvents = true;
        
        // Process each touch point
        for (let i = 0; i < event.touches.length; i++) {
            const touch = event.touches[i];
            this.touchState[touch.identifier] = {
                startX: touch.clientX,
                startY: touch.clientY,
                currentX: touch.clientX,
                currentY: touch.clientY
            };
        }
        
        // Simulate left mouse button press for tap
        if (event.touches.length > 0) {
            this.mouseState.buttons[0] = true;
        }
    }
    
    /**
     * Handle touch move
     * @param {TouchEvent} event - Touch event
     */
    onTouchMove(event) {
        event.preventDefault();
        
        // Process each touch point
        for (let i = 0; i < event.touches.length; i++) {
            const touch = event.touches[i];
            if (this.touchState[touch.identifier]) {
                const touchData = this.touchState[touch.identifier];
                
                // Update current position
                touchData.currentX = touch.clientX;
                touchData.currentY = touch.clientY;
                
                // Calculate deltas
                const deltaX = touchData.currentX - touchData.startX;
                const deltaY = touchData.currentY - touchData.startY;
                
                // Use left side of screen for movement, right side for looking
                if (touchData.startX < window.innerWidth / 2) {
                    // Left side - movement
                    this.axisStates.horizontal = deltaX / 100;
                    this.axisStates.vertical = -deltaY / 100;
                } else {
                    // Right side - looking/aiming
                    this.mouseDelta.x += deltaX / 10;
                    this.mouseDelta.y += deltaY / 10;
                }
            }
        }
    }
    
    /**
     * Handle touch end
     * @param {TouchEvent} event - Touch event
     */
    onTouchEnd(event) {
        event.preventDefault();
        
        // Remove ended touches
        const touches = event.changedTouches;
        for (let i = 0; i < touches.length; i++) {
            delete this.touchState[touches[i].identifier];
        }
        
        // Release mouse button when all touches are gone
        if (event.touches.length === 0) {
            delete this.mouseState.buttons[0];
        }
    }
    
    /**
     * Handle pointer lock change
     */
    onPointerLockChange() {
        // Reset mouse delta when pointer lock changes to prevent jumps
        this.mouseDelta = { x: 0, y: 0 };
    }
    
    /**
     * Request pointer lock for better mouse control
     * @param {HTMLElement} element - Element to lock pointer to
     */
    requestPointerLock(element) {
        if (element.requestPointerLock) {
            element.requestPointerLock();
        }
    }
    
    /**
     * Check if a specific key is currently pressed
     * @param {string|number} key - Key code or name to check
     * @returns {boolean} - True if the key is pressed
     */
    isKeyPressed(key) {
        return !!this.keyStates[key];
    }
    
    /**
     * Check if a key was just pressed this frame
     * @param {string|number} key - Key code or name to check
     * @returns {boolean} - True if the key was just pressed
     */
    isKeyDown(key) {
        return this.keyStates[key] && !this.prevKeyStates[key];
    }
    
    /**
     * Check if a key was just released this frame
     * @param {string|number} key - Key code or name to check
     * @returns {boolean} - True if the key was just released
     */
    isKeyUp(key) {
        return !this.keyStates[key] && this.prevKeyStates[key];
    }
    
    /**
     * Check if a mouse button is pressed
     * @param {number} button - Button index (0: left, 1: middle, 2: right)
     * @returns {boolean} - True if the button is pressed
     */
    isMouseButtonPressed(button) {
        return !!this.mouseState.buttons[button];
    }
    
    /**
     * Check if a mouse button was just pressed this frame
     * @param {number} button - Button index (0: left, 1: middle, 2: right)
     * @returns {boolean} - True if the button was just pressed
     */
    isMouseButtonDown(button) {
        return this.mouseState.buttons[button] && !this.prevMouseState.buttons[button];
    }
    
    /**
     * Check if a mouse button was just released this frame
     * @param {number} button - Button index (0: left, 1: middle, 2: right)
     * @returns {boolean} - True if the button was just released
     */
    isMouseButtonUp(button) {
        return !this.mouseState.buttons[button] && this.prevMouseState.buttons[button];
    }
    
    /**
     * Get an axis value (-1 to 1)
     * @param {string} axisName - Name of the axis (horizontal, vertical, mouseX, mouseY)
     * @returns {number} - Axis value between -1 and 1
     */
    getAxis(axisName) {
        return this.axisStates[axisName] || 0;
    }
    
    /**
     * Check if a button action is active
     * @param {string} buttonName - Name of the button action
     * @returns {boolean} - True if the button is active
     */
    getButton(buttonName) {
        const binding = this.keyBindings[buttonName];
        if (!binding) return false;
        
        // Check for keyboard binding
        if (binding.code && this.isKeyPressed(binding.code)) return true;
        if (binding.keyCode && this.isKeyPressed(binding.keyCode)) return true;
        
        // Check for mouse binding
        if (binding.mouseButton !== undefined && this.isMouseButtonPressed(binding.mouseButton)) return true;
        
        return false;
    }
    
    /**
     * Check if a button action was just triggered this frame
     * @param {string} buttonName - Name of the button action
     * @returns {boolean} - True if the button was just pressed
     */
    getButtonDown(buttonName) {
        const binding = this.keyBindings[buttonName];
        if (!binding) return false;
        
        // Check for keyboard binding
        if (binding.code && this.isKeyDown(binding.code)) return true;
        if (binding.keyCode && this.isKeyDown(binding.keyCode)) return true;
        
        // Check for mouse binding
        if (binding.mouseButton !== undefined && this.isMouseButtonDown(binding.mouseButton)) return true;
        
        return false;
    }
    
    /**
     * Check if a button action was just released this frame
     * @param {string} buttonName - Name of the button action
     * @returns {boolean} - True if the button was just released
     */
    getButtonUp(buttonName) {
        const binding = this.keyBindings[buttonName];
        if (!binding) return false;
        
        // Check for keyboard binding
        if (binding.code && this.isKeyUp(binding.code)) return true;
        if (binding.keyCode && this.isKeyUp(binding.keyCode)) return true;
        
        // Check for mouse binding
        if (binding.mouseButton !== undefined && this.isMouseButtonUp(binding.mouseButton)) return true;
        
        return false;
    }
    
    /**
     * Get current mouse position
     * @returns {Object} - {x, y} mouse coordinates
     */
    getMousePosition() {
        return { x: this.mouseState.x, y: this.mouseState.y };
    }
    
    /**
     * Get mouse movement since last update
     * @returns {Object} - {x, y} mouse movement deltas
     */
    getMouseDelta() {
        return { 
            x: this.axisStates.mouseX, 
            y: this.axisStates.mouseY 
        };
    }
    
    /**
     * Rebind a key for an action
     * @param {string} action - Action name
     * @param {string|number} keyCodeOrName - New key code or name
     * @param {boolean} isMouse - True if this is a mouse button binding
     */
    rebindKey(action, keyCodeOrName, isMouse = false) {
        if (!this.keyBindings[action]) {
            this.keyBindings[action] = {};
        }
        
        if (isMouse) {
            this.keyBindings[action].mouseButton = keyCodeOrName;
        } else if (typeof keyCodeOrName === 'number') {
            this.keyBindings[action].keyCode = keyCodeOrName;
        } else {
            this.keyBindings[action].code = keyCodeOrName;
        }
        
        // Save the updated bindings
        this.saveSettings();
    }
    
    /**
     * Set input configuration parameter
     * @param {string} paramName - Parameter name
     * @param {any} value - New value
     */
    setConfig(paramName, value) {
        if (this.config.hasOwnProperty(paramName)) {
            this.config[paramName] = value;
            this.saveSettings();
        }
    }
    
    /**
     * Save input settings to localStorage
     */
    saveSettings() {
        try {
            localStorage.setItem('inputBindings', JSON.stringify(this.keyBindings));
            localStorage.setItem('inputConfig', JSON.stringify(this.config));
        } catch (error) {
            console.warn('Failed to save input settings:', error);
        }
    }
    
    /**
     * Load input settings from localStorage
     */
    loadSettings() {
        try {
            const savedBindings = localStorage.getItem('inputBindings');
            if (savedBindings) {
                this.keyBindings = JSON.parse(savedBindings);
            }
            
            const savedConfig = localStorage.getItem('inputConfig');
            if (savedConfig) {
                const parsedConfig = JSON.parse(savedConfig);
                // Only update properties that already exist
                for (const key in parsedConfig) {
                    if (this.config.hasOwnProperty(key)) {
                        this.config[key] = parsedConfig[key];
                    }
                }
            }
        } catch (error) {
            console.warn('Failed to load input settings:', error);
        }
    }
    
    /**
     * Reset all bindings to defaults
     */
    resetToDefaults() {
        this.keyBindings = {
            moveForward: { code: 'KeyW', keyCode: 87 },
            moveBackward: { code: 'KeyS', keyCode: 83 },
            moveLeft: { code: 'KeyA', keyCode: 65 },
            moveRight: { code: 'KeyD', keyCode: 68 },
            firePrimary: { code: 'Space', keyCode: 32 },
            fireSecondary: { mouseButton: 2 },
            boost: { code: 'ShiftLeft', keyCode: 16 },
            reload: { code: 'KeyR', keyCode: 82 }
        };
        
        this.config = {
            mouseSensitivity: 1.0,
            deadzone: 0.1,
            smoothing: 0.2,
            invertY: false,
            invertX: false
        };
        
        this.saveSettings();
    }
}