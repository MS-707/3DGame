/**
 * Camera controller for Urban Tank Warfare
 * Handles camera following behavior for the player tank
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
        
        // Camera offset from target
        this.offset = new THREE.Vector3(0, 10, -20);
        
        // Damping factor for smooth camera movement (0-1)
        this.damping = 0.1;
        
        // Current camera position and look target
        this.currentPosition = new THREE.Vector3();
        this.currentLookAt = new THREE.Vector3();
        
        // Initial position
        if (target && target.position) {
            this.updatePosition();
        }
    }
    
    /**
     * Update camera position and rotation
     * @param {number} deltaTime - Time since last frame in seconds
     */
    update(deltaTime) {
        if (!this.target || !this.target.mesh) return;
        
        this.updatePosition();
    }
    
    /**
     * Update the camera position based on target
     */
    updatePosition() {
        // Get target position (handling different object structures)
        const targetPosition = this.getTargetPosition();
        
        // Calculate ideal camera position
        const idealPosition = targetPosition.clone().add(this.rotateOffsetWithTarget());
        
        // Apply smooth damping if we have current position
        if (this.currentPosition.lengthSq() > 0) {
            this.currentPosition.lerp(idealPosition, this.damping);
            this.camera.position.copy(this.currentPosition);
        } else {
            // First update, set directly
            this.currentPosition.copy(idealPosition);
            this.camera.position.copy(idealPosition);
        }
        
        // Look at target with slight offset for better view
        const lookAtPosition = targetPosition.clone().add(new THREE.Vector3(0, 2, 0));
        this.camera.lookAt(lookAtPosition);
    }
    
    /**
     * Get the target's position
     * @returns {THREE.Vector3} - Target position
     */
    getTargetPosition() {
        if (this.target.mesh) {
            return this.target.mesh.position.clone();
        } else if (this.target.position) {
            return this.target.position.clone();
        }
        return new THREE.Vector3();
    }
    
    /**
     * Rotate the camera offset based on target rotation
     * @returns {THREE.Vector3} - Rotated offset
     */
    rotateOffsetWithTarget() {
        const rotatedOffset = this.offset.clone();
        
        if (this.target.mesh) {
            // Extract target's Y rotation
            const targetRotationY = this.target.mesh.rotation.y;
            
            // Rotate offset around Y axis to match target rotation
            const rotationMatrix = new THREE.Matrix4().makeRotationY(targetRotationY);
            rotatedOffset.applyMatrix4(rotationMatrix);
        }
        
        return rotatedOffset;
    }
    
    /**
     * Set a new target for the camera to follow
     * @param {Object} target - New target
     */
    setTarget(target) {
        this.target = target;
        this.updatePosition();
    }
    
    /**
     * Handle window resize
     */
    handleResize() {
        // Update camera aspect ratio is handled in main.js
    }
}