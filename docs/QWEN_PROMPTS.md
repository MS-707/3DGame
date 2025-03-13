# Optimized Prompts for Qwen2.5-Coder-32B-Instruct

This document contains optimized prompts designed specifically for Qwen2.5-Coder-32B-Instruct to implement components of our 3D tank game. Each prompt is engineered to leverage Qwen's coding capabilities while maintaining architectural consistency with the overall project.

## Project Structure Implementation Prompt

```
# Task: Create Initial Project Structure for Web-Based Tank Game

You are implementing the foundational structure for a multiplayer 3D tank game using Three.js and WebSockets. Please create the initial project structure with the following requirements.

## Project Overview
- A multiplayer tank combat game set in a destructible city environment
- Uses Three.js for 3D rendering
- Will implement WebSockets for multiplayer
- Follows modular design principles with clear separation of concerns

## Required Files
Create the following files with appropriate starter code:

1. public/index.html - Main HTML file
2. public/css/style.css - Basic styling
3. src/client/main.js - Entry point for client code
4. src/client/scene.js - Three.js scene management
5. src/client/tank.js - Tank entity implementation
6. src/client/input.js - User input handling
7. src/client/camera.js - Camera management
8. src/shared/constants.js - Shared game constants
9. src/server/server.js - Basic Express server with WebSocket support

## Implementation Details

### 1. public/index.html
- Basic HTML5 structure
- Load Three.js from CDN
- Link to style.css
- Create canvas container
- Load main.js as a module

### 2. public/css/style.css
- Full-screen canvas
- Loading screen styling
- Basic UI elements

### 3. src/client/main.js
- Initialize game systems
- Set up asset loading
- Manage game loop
- Connect components

### 4. src/client/scene.js
- Three.js scene setup
- Basic lighting
- Ground plane
- Simple city blocks

### 5. src/client/tank.js
- Tank class with physics
- Movement controls
- Turret rotation
- Firing mechanism

### 6. src/client/input.js
- Input manager
- Keyboard/mouse controls
- Input mapping system

### 7. src/client/camera.js
- Follow camera
- Camera controls
- Screen shake effects

### 8. src/shared/constants.js
- Game physics constants
- Network message types
- Entity types

### 9. src/server/server.js
- Express server
- WebSocket setup
- Basic game state management

## Code Style Requirements
- ES modules (import/export)
- Clear documentation
- Consistent naming conventions
- Modular, testable design
- Error handling

Please provide complete implementations for all these files with working starter code that can be run locally.
```

## Three.js Scene Implementation Prompt

```
# Task: Implement Three.js Scene with Urban Environment

You are creating the 3D scene for our tank game using Three.js. Please implement a scene.js module that creates an urban environment for tank combat.

## Requirements
- Create a modular Scene class
- Set up basic Three.js scene, camera, and renderer
- Implement a simple urban environment with buildings
- Add appropriate lighting for an urban setting
- Include performance optimizations
- Support window resizing

## Scene Features
- Ground plane with grid texture
- Simple procedurally generated buildings
- Day/night cycle capability
- Fog for atmosphere
- Basic shadows

## Code Interface
The Scene class should have these public methods:
- constructor(container) - Initialize with DOM container
- init() - Set up the scene
- update(deltaTime) - Update scene each frame
- resize(width, height) - Handle window resizing
- getScene() - Return Three.js scene object
- getCamera() - Return camera object
- addObject(object) - Add an object to the scene
- removeObject(object) - Remove an object from the scene

## Implementation Notes
- Use ES6 class syntax
- Implement clean disposal/cleanup to prevent memory leaks
- Add comments explaining key aspects
- Include performance considerations

Please provide the complete implementation of the scene.js file ready to be imported into main.js.
```

## Tank Entity Implementation Prompt

```
# Task: Create Tank Entity with Physics and Controls

Implement a Tank class for our 3D tank game that handles rendering, physics, and control of a player tank in Three.js.

## Requirements
- Create a Tank class that represents a playable tank
- Implement realistic tank movement physics
- Add tank rendering with hull and turret components
- Handle user input for movement and firing
- Include collision detection
- Implement weapon systems

## Tank Features
- Separate turret rotation from hull movement
- Realistic acceleration/deceleration
- Track-based steering physics
- Main cannon with recoil
- Health/damage system
- Optional secondary weapons

## Code Interface
The Tank class should have these public methods:
- constructor(scene, position, rotation) - Create new tank
- update(deltaTime) - Update tank physics
- handleInput(inputState) - Process user input
- fire() - Fire main weapon
- damage(amount) - Apply damage
- getPosition() - Get current position
- getRotation() - Get current rotation
- dispose() - Clean up resources

## Implementation Notes
- Start with simple box geometry for prototyping
- Implement physics before adding detailed models
- Separate visual representation from physics
- Use composition over inheritance

Please provide the complete implementation of the tank.js file that can be imported and used in our game.
```

## Input System Implementation Prompt

```
# Task: Develop Input Management System for Tank Game

Create a robust input system that translates keyboard/mouse actions into game commands for our tank game.

## Requirements
- Create an InputManager class
- Handle keyboard and mouse input
- Support customizable key bindings
- Provide both digital and analog input processing
- Implement input buffering for responsive controls

## Input Features
- WASD for tank movement
- Mouse for turret aiming
- Mouse buttons for firing
- Key rebinding capability
- Gamepad support (optional)

## Code Interface
The InputManager class should have these public methods:
- constructor() - Set up the input manager
- init() - Initialize event listeners
- update() - Update input states
- getAxis(axisName) - Get analog input (-1 to 1)
- getButton(buttonName) - Get digital input state
- getButtonDown(buttonName) - Get "just pressed" state
- getButtonUp(buttonName) - Get "just released" state
- rebindKey(action, keyCode) - Change key mapping
- saveKeyBindings() - Persist key bindings
- loadKeyBindings() - Load saved key bindings

## Implementation Notes
- Use event listeners for keyboard/mouse
- Normalize analog inputs
- Handle browser-specific quirks
- Support simultaneous key presses
- Prevent input conflicts

Please provide the complete implementation of input.js ready to be integrated with our tank game.
```

## Camera System Implementation Prompt

```
# Task: Create Camera System for Tank Game

Implement a flexible camera system for our tank game that provides different viewing modes and smooth following behavior.

## Requirements
- Create a CameraController class
- Implement different camera modes (follow, overhead, first-person)
- Add smooth camera transitions
- Handle screen shake for impacts
- Implement collision avoidance with environment

## Camera Features
- Third-person follow camera as default
- Orbital controls for overview
- Camera collision avoidance
- Smooth damping for movement
- Screen shake effect for impacts
- FOV adjustment for speed changes

## Code Interface
The CameraController class should have these public methods:
- constructor(scene, target) - Initialize with scene and target
- update(deltaTime) - Update camera position/rotation
- setTarget(target) - Change follow target
- setMode(modeName) - Change camera mode
- shake(intensity, duration) - Trigger screen shake
- getCamera() - Get camera object
- handleResize() - Handle window resizing

## Implementation Notes
- Use Three.js PerspectiveCamera
- Implement smooth interpolation for position/rotation
- Consider performance for collision checks
- Add some "weight" to camera movement
- Keep field of view adjustments subtle

Please provide the complete implementation of camera.js that works with our Three.js environment.
```

## Networking Foundation Prompt

```
# Task: Implement Basic Networking for Multiplayer Tank Game

Create the client-side networking foundation for our multiplayer tank game, focusing on WebSocket communication.

## Requirements
- Create a NetworkManager class for client-side networking
- Implement WebSocket connection to server
- Set up message serialization/deserialization
- Handle connection events and errors
- Implement basic game state synchronization

## Networking Features
- Connect to WebSocket server
- Send player input to server
- Receive game state updates
- Handle network entities
- Implement client-side prediction
- Support reconnection

## Code Interface
The NetworkManager class should have these public methods:
- constructor() - Set up network manager
- connect(serverUrl) - Connect to server
- disconnect() - Close connection
- sendInput(inputState) - Send player input
- sendEvent(eventType, data) - Send game event
- onGameState(callback) - Register state update handler
- onPlayerJoined(callback) - Handle player join
- onPlayerLeft(callback) - Handle player leave
- isConnected() - Check connection status

## Implementation Notes
- Use native WebSocket API
- Implement efficient message format (JSON initially)
- Consider latency compensation
- Handle connection errors gracefully
- Add reconnection logic

Please provide the complete implementation of a network.js file that can be integrated with our game.
```

## Instructions for Using These Prompts with Qwen2.5-Coder-32B-Instruct

1. Use these prompts one at a time with Qwen2.5-Coder-32B-Instruct
2. Start with the Project Structure prompt to establish the foundation
3. Implement individual components following the modular architecture
4. Review each implementation before integration
5. If Qwen struggles with any implementation, break it down into smaller subtasks

These prompts are designed to maximize Qwen's coding strengths while maintaining architectural consistency with our overall design. Each prompt provides clear requirements, interfaces, and validation criteria to ensure high-quality output.

When receiving code from Qwen, verify:
- Code follows ES6 module standards
- Public APIs match specified interfaces
- Error handling is properly implemented
- Code is well-documented
- Performance considerations are addressed