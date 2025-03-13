/**
 * Camera controller for Urban Tank Warfare
 * Handles different camera modes and following behavior
 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.146.1/build/three.module.js';

export class CameraController {
    /**
     * Initialize the camera controller
     * @param {THREE.Camera} camera - The Three.js camera
     * @param {Object} target - The target to follow (usually the player's tank)
     */
    constructor(camera, target) {
        this.camera = camera;
        this.target = target;
        this.mode = 'follow'; // Default mode
        
        // Camera settings
        this.distance = 20;
        this.height = 10;
        this.lookAhead = 5;
        this.damping = 0.05;
        
        // Current values
        this.currentPosition = new THREE.Vector3();
        this.currentLookAt = new THREE.Vector3();
        
        // Screen shake
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
        this.shakeStart = 0;
    }
    
    /**
     * Update camera position and rotation
     * @param {number} deltaTime - Time since last frame in seconds
     */
    update(deltaTime) {
        if (!this.target) return;
        
        // Calculate ideal camera position based on mode
        let idealPosition;
        let idealLookAt;
        
        switch (this.mode) {
            case 'follow':
                idealPosition = this.calculateFollowPosition();
                idealLookAt = this.calculateLookAt();
                break;
                
            case 'overhead':
                idealPosition = this.calculateOverheadPosition();
                idealLookAt = this.calculateLookAt();
                break;
                
            case 'firstPerson':
                idealPosition = this.calculateFirstPersonPosition();
                idealLookAt = this.calculateFirstPersonLookAt();
                break;
                
            default:
                idealPosition = this.calculateFollowPosition();
                idealLookAt = this.calculateLookAt();
        }
        
        // Apply damping for smooth camera movement
        this.currentPosition.lerp(idealPosition, this.damping);
        this.currentLookAt.lerp(idealLookAt, this.damping);
        
        // Apply screen shake if active
        if (this.shakeIntensity > 0) {
            this.applyScreenShake();
        }
        
        // Update camera
        this.camera.position.copy(this.currentPosition);
        this.camera.lookAt(this.currentLookAt);
    }
    
    /**
     * Calculate position for follow camera mode
     * @returns {THREE.Vector3} - Ideal camera position
     */
    calculateFollowPosition() {
        // Get tank position and direction
        const targetPosition = this.getTargetPosition();
        const targetDirection = this.getTargetDirection();
        
        // Position camera behind and above the tank
        return new THREE.Vector3(
            targetPosition.x - targetDirection.x * this.distance,
            targetPosition.y + this.height,
            targetPosition.z - targetDirection.z * this.distance
        );
    }
    
    /**
     * Calculate position for overhead camera mode
     * @returns {THREE.Vector3} - Ideal camera position
     */
    calculateOverheadPosition() {
        const targetPosition = this.getTargetPosition();
        
        // Position camera directly above the tank
        return new THREE.Vector3(
            targetPosition.x,
            targetPosition.y + this.distance,
            targetPosition.z
        );
    }
    
    /**
     * Calculate position for first-person camera mode
     * @returns {THREE.Vector3} - Ideal camera position
     */
    calculateFirstPersonPosition() {
        // Get tank position, direction and turret position
        const targetPosition = this.getTargetPosition();
        const targetDirection = this.getTargetDirection();
        
        // Position camera at turret level
        return new THREE.Vector3(
            targetPosition.x,
            targetPosition.y + 3, // Turret height
            targetPosition.z
        );
    }
    
    /**
     * Calculate camera look-at point
     * @returns {THREE.Vector3} - Point to look at
     */
    calculateLookAt() {
        const targetPosition = this.getTargetPosition();
        const targetDirection = this.getTargetDirection();
        
        // Look ahead of the tank
        return new THREE.Vector3(
            targetPosition.x + targetDirection.x * this.lookAhead,
            targetPosition.y,
            targetPosition.z + targetDirection.z * this.lookAhead
        );
    }
    
    /**
     * Calculate first-person look-at point
     * @returns {THREE.Vector3} - Point to look at
     */
    calculateFirstPersonLookAt() {
        const targetPosition = this.getTargetPosition();
        const targetDirection = this.getTargetDirection();
        
        // Look in the direction the turret is facing
        const turretDirection = new THREE.Vector3(0, 0, -1)
            .applyQuaternion(this.target.turret.quaternion)
            .applyQuaternion(this.target.mesh.quaternion);
            
        return new THREE.Vector3(
            targetPosition.x + turretDirection.x * 100,
            targetPosition.y + turretDirection.y * 100,
            targetPosition.z + turretDirection.z * 100
        );
    }
    
    /**
     * Get the target's position
     * @returns {THREE.Vector3} - Target position
     */
    getTargetPosition() {
        return this.target.mesh ? this.target.mesh.position.clone() : this.target.position.clone();
    }
    
    /**
     * Get the target's forward direction
     * @returns {THREE.Vector3} - Normalized direction vector
     */
    getTargetDirection() {
        const direction = new THREE.Vector3(0, 0, -1);
        if (this.target.mesh) {
            direction.applyQuaternion(this.target.mesh.quaternion);
        } else if (this.target.quaternion) {
            direction.applyQuaternion(this.target.quaternion);
        }
        return direction;
    }
    
    /**
     * Change camera mode
     * @param {string} mode - Camera mode ('follow', 'overhead', 'firstPerson')
     */
    setMode(mode) {
        this.mode = mode;
    }
    
    /**
     * Set a new target for the camera to follow
     * @param {Object} target - New target
     */
    setTarget(target) {
        this.target = target;
    }
    
    /**
     * Trigger a screen shake effect
     * @param {number} intensity - Shake intensity
     * @param {number} duration - Shake duration in milliseconds
     */
    shake(intensity, duration) {
        this.shakeIntensity = intensity;
        this.shakeDuration = duration;
        this.shakeStart = Date.now();
    }
    
    /**
     * Apply screen shake effect
     */
    applyScreenShake() {
        const elapsed = Date.now() - this.shakeStart;
        
        if (elapsed > this.shakeDuration) {
            this.shakeIntensity = 0;
            return;
        }
        
        // Calculate remaining intensity based on time elapsed
        const remainingIntensity = this.shakeIntensity * (1 - elapsed / this.shakeDuration);
        
        // Add random offset to camera position
        this.camera.position.x += (Math.random() - 0.5) * remainingIntensity;
        this.camera.position.y += (Math.random() - 0.5) * remainingIntensity;
        this.camera.position.z += (Math.random() - 0.5) * remainingIntensity;
    }
    
    /**
     * Handle window resize
     */
    handleResize() {
        // Update camera aspect ratio in main.js
    }
}