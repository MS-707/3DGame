/**
 * Tank implementation for Urban Tank Warfare
 * Handles tank movement, physics, and weapons
 */

// Import Three.js from CDN
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.146.1/build/three.module.js';

// Tank physics constants
export const Constants = {
    TANK_SPEED: 5,
    TURRET_ROTATION_SPEED: Math.PI / 180,
    TANK_ID: 'player'
};

/**
 * Tank class representing a player-controlled tank
 */
export class Tank {
    /**
     * Create a new tank
     * @param {THREE.Scene} scene - The Three.js scene
     * @param {string} id - Unique identifier for the tank
     */
    constructor(scene, id) {
        this.id = id;
        this.mesh = new THREE.Group();
        this.velocity = new THREE.Vector3();
        this.health = 100;
        this.ammo = 20;
        this.lastShotTime = 0;
        this.reloadTime = 1000; // milliseconds

        // Create tank components
        this.createTankBody();
        
        // Add tank to scene
        scene.add(this.mesh);
    }
    
    /**
     * Create the tank body and components
     */
    createTankBody() {
        // Tank body
        const bodyGeometry = new THREE.BoxGeometry(5, 2, 6);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x556b2f,
            roughness: 0.7,
            metalness: 0.3
        });
        this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.body.castShadow = true;
        this.body.receiveShadow = true;
        this.mesh.add(this.body);

        // Turret
        const turretGeometry = new THREE.CylinderGeometry(1.5, 1.5, 1.5, 16);
        const turretMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x4a5d23,
            roughness: 0.6, 
            metalness: 0.4
        });
        this.turret = new THREE.Mesh(turretGeometry, turretMaterial);
        this.turret.position.y = 1.75;
        this.turret.castShadow = true;
        this.turret.receiveShadow = true;
        this.mesh.add(this.turret);
        
        // Cannon
        const cannonGeometry = new THREE.CylinderGeometry(0.4, 0.4, 5, 12);
        const cannonMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.5,
            metalness: 0.7
        });
        this.cannon = new THREE.Mesh(cannonGeometry, cannonMaterial);
        this.cannon.position.set(0, 0, 3);
        this.cannon.rotation.x = Math.PI / 2;
        this.cannon.castShadow = true;
        this.turret.add(this.cannon);
        
        // Tank tracks
        this.createTracks();
    }
    
    /**
     * Create tank tracks
     */
    createTracks() {
        const trackGeometry = new THREE.BoxGeometry(1.2, 1, 6);
        const trackMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            roughness: 0.9,
            metalness: 0.2
        });
        
        // Left track
        this.leftTrack = new THREE.Mesh(trackGeometry, trackMaterial);
        this.leftTrack.position.set(-2.5, -0.5, 0);
        this.leftTrack.castShadow = true;
        this.leftTrack.receiveShadow = true;
        this.mesh.add(this.leftTrack);
        
        // Right track
        this.rightTrack = new THREE.Mesh(trackGeometry, trackMaterial);
        this.rightTrack.position.set(2.5, -0.5, 0);
        this.rightTrack.castShadow = true;
        this.rightTrack.receiveShadow = true;
        this.mesh.add(this.rightTrack);
    }

    /**
     * Update tank state based on input and physics
     * @param {InputManager} inputManager - The input manager
     */
    update(inputManager) {
        // Update tank position based on input
        const moveDirection = new THREE.Vector3();

        if (inputManager.keys['KeyW']) {
            moveDirection.z -= 1;
        }
        if (inputManager.keys['KeyS']) {
            moveDirection.z += 1;
        }
        if (inputManager.keys['KeyA']) {
            this.mesh.rotation.y += Constants.TANK_SPEED * 0.01;
        }
        if (inputManager.keys['KeyD']) {
            this.mesh.rotation.y -= Constants.TANK_SPEED * 0.01;
        }

        // Apply movement in the direction the tank is facing
        if (moveDirection.length() > 0) {
            moveDirection.normalize();
            const rotatedDirection = moveDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.mesh.rotation.y);
            this.velocity.copy(rotatedDirection).multiplyScalar(Constants.TANK_SPEED * 0.1);
            this.mesh.position.add(this.velocity);
        }

        // Update turret rotation based on mouse position
        const mousePosition = inputManager.mousePosition;
        if (mousePosition) {
            // Convert screen space to world direction
            const vector = new THREE.Vector3(
                (mousePosition.x / window.innerWidth) * 2 - 1,
                -(mousePosition.y / window.innerHeight) * 2 + 1,
                0.5
            );
            
            vector.unproject(window.camera); // This assumes camera is available globally
            vector.sub(window.camera.position).normalize();
            
            // Project onto XZ plane for turret rotation
            const targetAngle = Math.atan2(vector.x, vector.z);
            
            // Smoothly rotate turret towards target
            let currentAngle = this.turret.rotation.y;
            let angleDiff = targetAngle - currentAngle;
            
            // Normalize angle difference to [-PI, PI]
            if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            
            // Apply smooth rotation
            if (Math.abs(angleDiff) > 0.01) {
                this.turret.rotation.y += angleDiff * 0.1; // Smooth interpolation
            }
        }
        
        // Handle shooting
        if (inputManager.keys['Space']) {
            this.shoot();
        }
    }

    /**
     * Fire the tank's main cannon
     */
    shoot() {
        const now = Date.now();
        if (now - this.lastShotTime < this.reloadTime || this.ammo <= 0) {
            return; // Can't shoot yet or out of ammo
        }
        
        this.lastShotTime = now;
        this.ammo--;
        
        console.log('Shooting! Ammo remaining:', this.ammo);
        
        // Here we would create a projectile and add to scene
        // For now, just log the action
    }
    
    /**
     * Apply damage to the tank
     * @param {number} amount - Amount of damage to apply
     */
    damage(amount) {
        this.health -= amount;
        console.log(`Tank took ${amount} damage. Health: ${this.health}`);
        
        if (this.health <= 0) {
            this.destroy();
        }
    }
    
    /**
     * Destroy the tank
     */
    destroy() {
        console.log('Tank destroyed!');
        // Here we would remove the tank from the scene
        // and perhaps play an explosion effect
    }
    
    /**
     * Get the tank's current position
     * @returns {THREE.Vector3}
     */
    getPosition() {
        return this.mesh.position.clone();
    }
    
    /**
     * Get the tank's current rotation
     * @returns {THREE.Euler}
     */
    getRotation() {
        return this.mesh.rotation.clone();
    }
}