/**
 * Camera controller for Urban Tank Warfare
 * Handles camera positioning, movement, and special effects
 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.146.1/build/three.module.js';

export class CameraController {
    /**
     * Initialize the camera controller
     * @param {THREE.Camera} camera - The Three.js camera
     * @param {Object} target - Target to follow (usually the player's tank)
     */
    constructor(camera, target) {
        // Core properties
        this.camera = camera;
        this.target = target;
        
        // Camera modes
        this.modes = {
            FOLLOW: 'follow',
            OVERHEAD: 'overhead',
            FIRST_PERSON: 'first-person',
            CINEMATIC: 'cinematic'
        };
        this.currentMode = this.modes.FOLLOW;
        
        // Offset positions for different modes
        this.offsets = {
            follow: new THREE.Vector3(0, 8, -15),
            overhead: new THREE.Vector3(0, 30, 0),
            firstPerson: new THREE.Vector3(0, 2.5, 0),
            cinematic: new THREE.Vector3(15, 5, -15)
        };
        
        // Camera behavior settings
        this.settings = {
            damping: 0.1,           // Smoothing factor (0-1)
            rotationDamping: 0.05,  // Rotation smoothing
            collisionRadius: 2.0,   // For collision avoidance
            baseFOV: 75,            // Default field of view
            speedFOVFactor: 0.2,    // How much speed affects FOV
            lookAheadFactor: 2.0    // How far to look ahead of target
        };
        
        // Screen shake effect
        this.shake = {
            intensity: 0,
            duration: 0,
            maxOffset: new THREE.Vector3(),
            trauma: 0              // For trauma-based screen shake
        };
        
        // Current state
        this.currentPosition = new THREE.Vector3();
        this.currentLookAt = new THREE.Vector3();
        this.cinematicTime = 0;
        
        // For collision detection
        this.raycaster = new THREE.Raycaster();
        this.collisionResultCache = [];
        
        // Set initial state
        this.updatePositions();
    }
    
    /**
     * Update camera position and rotation
     * @param {number} deltaTime - Time since last frame in seconds
     */
    update(deltaTime) {
        if (!this.target) return;
        
        // Update target positions based on mode
        this.updatePositions();
        
        // Get target position based on current mode
        const targetPosition = this.getTargetPosition();
        const lookAtPosition = this.getTargetLookAt();
        
        // Apply damping for smooth camera movement
        if (this.currentPosition.lengthSq() > 0) {
            // Position damping
            this.currentPosition.lerp(targetPosition, this.settings.damping);
            this.camera.position.copy(this.currentPosition);
            
            // Look at damping
            this.currentLookAt.lerp(lookAtPosition, this.settings.damping);
            this.camera.lookAt(this.currentLookAt);
        } else {
            // First update, set directly
            this.currentPosition.copy(targetPosition);
            this.camera.position.copy(targetPosition);
            this.currentLookAt.copy(lookAtPosition);
            this.camera.lookAt(this.currentLookAt);
        }
        
        // Update cinematic mode if active
        if (this.currentMode === this.modes.CINEMATIC) {
            this.updateCinematicCamera(deltaTime);
        }
        
        // Apply screen shake if active
        if (this.shake.duration > 0) {
            this.applyScreenShake(deltaTime);
        }
        
        // Apply trauma-based screen shake
        if (this.shake.trauma > 0) {
            this.applyTraumaShake(deltaTime);
        }
        
        // Avoid collisions with environment
        this.avoidCollisions();
    }
    
    /**
     * Calculate target position based on current mode
     * @returns {THREE.Vector3} Target camera position
     */
    getTargetPosition() {
        const targetPos = new THREE.Vector3();
        const targetDir = this.getTargetDirection();
        
        // Get base position of target
        const basePosition = this.target.mesh ? 
            this.target.mesh.position.clone() : 
            this.target.position ? this.target.position.clone() : new THREE.Vector3();
        
        // Apply offset based on camera mode
        switch (this.currentMode) {
            case this.modes.FOLLOW:
                // Follow behind with rotation consideration
                targetPos.copy(basePosition);
                const followOffset = this.offsets.follow.clone();
                
                // Rotate offset based on target orientation
                if (this.target.mesh) {
                    // Extract targetRotationY
                    const targetRotationY = this.target.mesh.rotation.y;
                    
                    // Create rotation matrix
                    const rotationMatrix = new THREE.Matrix4().makeRotationY(targetRotationY);
                    followOffset.applyMatrix4(rotationMatrix);
                }
                
                targetPos.add(followOffset);
                break;
                
            case this.modes.OVERHEAD:
                // Directly above target
                targetPos.copy(basePosition).add(this.offsets.overhead);
                break;
                
            case this.modes.FIRST_PERSON:
                // First-person view from tank
                targetPos.copy(basePosition).add(this.offsets.firstPerson);
                
                if (this.target.turret) {
                    // Get turret's rotation
                    const quaternion = new THREE.Quaternion();
                    this.target.turret.getWorldQuaternion(quaternion);
                    
                    // Adjust first-person position based on turret rotation
                    const fp = new THREE.Vector3(0, 0, 0);
                    fp.applyQuaternion(quaternion);
                    targetPos.add(fp);
                }
                break;
                
            case this.modes.CINEMATIC:
                // Cinematic floating camera
                targetPos.copy(basePosition).add(this.offsets.cinematic);
                break;
                
            default:
                // Default to follow mode
                targetPos.copy(basePosition).add(this.offsets.follow);
        }
        
        return targetPos;
    }
    
    /**
     * Calculate look-at position based on current mode
     * @returns {THREE.Vector3} Position to look at
     */
    getTargetLookAt() {
        const lookAt = new THREE.Vector3();
        const basePosition = this.target.mesh ? 
            this.target.mesh.position.clone() : 
            this.target.position ? this.target.position.clone() : new THREE.Vector3();
            
        switch (this.currentMode) {
            case this.modes.FOLLOW:
                // Look ahead of the target's direction
                lookAt.copy(basePosition);
                
                // Add a slight offset for better visibility
                lookAt.y += 2;
                
                // Look ahead of the tank based on direction
                if (this.target.mesh) {
                    const direction = new THREE.Vector3(0, 0, -1);
                    direction.applyQuaternion(this.target.mesh.quaternion);
                    direction.multiplyScalar(this.settings.lookAheadFactor);
                    lookAt.add(direction);
                }
                break;
                
            case this.modes.OVERHEAD:
                // Look directly at the target
                lookAt.copy(basePosition);
                break;
                
            case this.modes.FIRST_PERSON:
                // Look where the turret is pointing
                lookAt.copy(basePosition);
                
                if (this.target.turret) {
                    // Get turret's direction
                    const direction = new THREE.Vector3(0, 0, -10);
                    const quaternion = new THREE.Quaternion();
                    this.target.turret.getWorldQuaternion(quaternion);
                    direction.applyQuaternion(quaternion);
                    
                    // Apply target's rotation
                    if (this.target.mesh) {
                        direction.applyQuaternion(this.target.mesh.quaternion);
                    }
                    
                    lookAt.add(direction);
                } else {
                    // Fallback if no turret
                    const direction = new THREE.Vector3(0, 0, -10);
                    if (this.target.mesh) {
                        direction.applyQuaternion(this.target.mesh.quaternion);
                    }
                    lookAt.add(direction);
                }
                break;
                
            case this.modes.CINEMATIC:
                // Look at the target
                lookAt.copy(basePosition);
                lookAt.y += 2; // Slightly above ground level
                break;
                
            default:
                // Default to looking at target
                lookAt.copy(basePosition);
        }
        
        return lookAt;
    }
    
    /**
     * Get direction vector of target
     * @returns {THREE.Vector3} Normalized direction vector
     */
    getTargetDirection() {
        const direction = new THREE.Vector3(0, 0, -1);
        
        if (this.target.mesh) {
            direction.applyQuaternion(this.target.mesh.quaternion);
        }
        
        return direction;
    }
    
    /**
     * Update position data
     */
    updatePositions() {
        // This is called first to ensure we have the latest positions
        // before calculating camera positions
    }
    
    /**
     * Update camera in cinematic mode
     * @param {number} deltaTime - Time since last frame in seconds
     */
    updateCinematicCamera(deltaTime) {
        // Update the cinematic timer
        this.cinematicTime += deltaTime;
        
        // Circular motion pattern
        const angle = this.cinematicTime * 0.5;
        const radius = 20;
        
        // Update cinematic offset
        this.offsets.cinematic.x = Math.sin(angle) * radius;
        this.offsets.cinematic.z = Math.cos(angle) * radius;
    }
    
    /**
     * Apply screen shake effect
     * @param {number} deltaTime - Time since last frame in seconds
     */
    applyScreenShake(deltaTime) {
        // Reduce shake duration
        this.shake.duration -= deltaTime;
        
        if (this.shake.duration <= 0) {
            this.shake.intensity = 0;
            return;
        }
        
        // Calculate remaining intensity
        const remainingIntensity = this.shake.intensity * (this.shake.duration / this.shake.duration);
        
        // Apply random offset to camera
        const offset = new THREE.Vector3(
            (Math.random() * 2 - 1) * remainingIntensity,
            (Math.random() * 2 - 1) * remainingIntensity,
            (Math.random() * 2 - 1) * remainingIntensity
        );
        
        this.camera.position.add(offset);
    }
    
    /**
     * Apply trauma-based screen shake
     * @param {number} deltaTime - Time since last frame in seconds
     */
    applyTraumaShake(deltaTime) {
        // Trauma decays over time
        this.shake.trauma = Math.max(0, this.shake.trauma - deltaTime);
        
        // Square trauma for more natural shake falloff
        const shake = this.shake.trauma * this.shake.trauma;
        
        // Perlin noise would be ideal here, but we'll use a simple approximation
        const time = performance.now() * 0.001;
        const offsetX = Math.sin(time * 25) * shake * this.shake.maxOffset.x;
        const offsetY = Math.sin(time * 31) * shake * this.shake.maxOffset.y;
        const offsetZ = Math.sin(time * 29) * shake * this.shake.maxOffset.z;
        
        const shakeOffset = new THREE.Vector3(offsetX, offsetY, offsetZ);
        this.camera.position.add(shakeOffset);
    }
    
    /**
     * Avoid collisions with scene objects
     */
    avoidCollisions() {
        // Skip collision detection in first-person mode
        if (this.currentMode === this.modes.FIRST_PERSON) return;
        
        // Create a ray from target to camera
        const rayStart = this.target.mesh ? 
            this.target.mesh.position.clone() :
            this.target.position ? this.target.position.clone() : new THREE.Vector3();
        
        const rayDirection = new THREE.Vector3().subVectors(this.camera.position, rayStart).normalize();
        this.raycaster.set(rayStart, rayDirection);
        
        // Calculate desired distance
        const desiredDistance = rayStart.distanceTo(this.camera.position);
        
        // Check for collisions
        // Note: In a real implementation, you would pass scene objects here
        // const intersects = this.raycaster.intersectObjects(sceneObjects);
        const intersects = this.collisionResultCache;
        
        if (intersects.length > 0) {
            // Find closest intersection
            const closest = intersects[0];
            
            // If intersection is between target and camera
            if (closest.distance < desiredDistance) {
                // Place camera just before the intersection
                const newPos = rayStart.clone().add(
                    rayDirection.multiplyScalar(closest.distance - 0.5)
                );
                this.camera.position.copy(newPos);
            }
        }
    }
    
    /**
     * Trigger a screen shake effect
     * @param {number} intensity - Shake intensity
     * @param {number} duration - Shake duration in seconds
     */
    shakeCamera(intensity, duration) {
        this.shake.intensity = intensity;
        this.shake.duration = duration;
    }
    
    /**
     * Add trauma to camera (for more natural shakes)
     * @param {number} amount - Amount of trauma to add (0-1)
     * @param {number} maxOffsetX - Maximum X offset
     * @param {number} maxOffsetY - Maximum Y offset
     * @param {number} maxOffsetZ - Maximum Z offset
     */
    addTrauma(amount, maxOffsetX = 0.3, maxOffsetY = 0.3, maxOffsetZ = 0.1) {
        this.shake.trauma = Math.min(1, this.shake.trauma + amount);
        this.shake.maxOffset.set(maxOffsetX, maxOffsetY, maxOffsetZ);
    }
    
    /**
     * Change camera mode
     * @param {string} mode - New camera mode
     */
    setMode(mode) {
        if (this.modes[mode]) {
            this.currentMode = this.modes[mode];
        } else {
            console.warn(`Unknown camera mode: ${mode}`);
        }
    }
    
    /**
     * Set a new target for the camera to follow
     * @param {Object} target - New target
     */
    setTarget(target) {
        this.target = target;
        this.updatePositions();
    }
    
    /**
     * Handle window resize
     */
    handleResize() {
        if (!this.camera) return;
        
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
    }
    
    /**
     * Get the current camera
     * @returns {THREE.Camera}
     */
    getCamera() {
        return this.camera;
    }
}