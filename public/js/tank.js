/**
 * Tank entity for Urban Tank Warfare
 * Handles tank rendering, physics, and weapons
 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.146.1/build/three.module.js';
import { GAME_PHYSICS } from './constants.js';

export class Tank {
    /**
     * Create a new tank
     * @param {Object} scene - The scene object to add the tank to
     * @param {Object} position - Initial position {x, y, z}
     * @param {Object} rotation - Initial rotation {x, y, z}
     */
    constructor(scene, position = { x: 0, y: 0.5, z: 0 }, rotation = { x: 0, y: 0, z: 0 }) {
        // Core properties
        this.scene = scene;
        this.mesh = new THREE.Group();
        this.id = Math.random().toString(36).substring(2, 9);
        
        // Tank components
        this.hull = null;
        this.turret = null;
        this.cannon = null;
        this.leftTrack = null;
        this.rightTrack = null;
        this.exhaustSystem = null;
        
        // Physics properties
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3(0, 0, -1);
        this.currentSpeed = 0;
        this.targetSpeed = 0;
        this.turretRotation = 0;
        
        // Performance specs
        this.maxSpeed = 8;
        this.acceleration = 4;
        this.deceleration = 6;
        this.maxReverseSpeed = 4;
        this.rotationSpeed = 1.5;
        this.turretRotationSpeed = 2;
        
        // Status
        this.health = 100;
        this.maxHealth = 100;
        this.isAlive = true;
        this.isFiring = false;
        this.lastFireTime = 0;
        this.fireRate = 1000; // milliseconds between shots
        
        // Effects
        this.trackMarks = [];
        this.engineSound = null;
        this.exhaust = null;
        
        // Create tank mesh
        this.createTankMesh();
        
        // Set initial position and rotation
        this.mesh.position.set(position.x, position.y, position.z);
        this.mesh.rotation.set(rotation.x, rotation.y, rotation.z);
        
        // Add to scene
        this.scene.addObject(this.mesh);
    }
    
    /**
     * Create the tank mesh with all components
     */
    createTankMesh() {
        // Create hull (base body)
        this.createHull();
        
        // Create turret
        this.createTurret();
        
        // Create tracks
        this.createTracks();
        
        // Create exhaust system
        this.createExhaustSystem();
        
        // Add details
        this.addDetails();
    }
    
    /**
     * Create the tank hull (main body)
     */
    createHull() {
        // Main hull (slightly rounded box)
        const hullGeometry = new THREE.BoxGeometry(4.5, 1.8, 7);
        const hullMaterial = new THREE.MeshStandardMaterial({
            color: 0x567d46, // Military green
            roughness: 0.7,
            metalness: 0.3
        });
        this.hull = new THREE.Mesh(hullGeometry, hullMaterial);
        this.hull.castShadow = true;
        this.hull.receiveShadow = true;
        
        // Round the edges with bevel
        hullGeometry.translate(0, 0.9, 0); // Move pivot to bottom
        
        // Add to tank mesh
        this.mesh.add(this.hull);
        
        // Front armor (angled)
        const frontArmorGeometry = new THREE.BoxGeometry(4.2, 1.4, 1);
        const frontArmorMaterial = new THREE.MeshStandardMaterial({
            color: 0x4c6b3d, // Darker green
            roughness: 0.6,
            metalness: 0.4
        });
        const frontArmor = new THREE.Mesh(frontArmorGeometry, frontArmorMaterial);
        frontArmor.position.set(0, 0.2, -3);
        frontArmor.rotation.x = -Math.PI / 8; // Angle downward slightly
        frontArmor.castShadow = true;
        frontArmor.receiveShadow = true;
        this.hull.add(frontArmor);
        
        // Add driver hatch
        const hatchGeometry = new THREE.CylinderGeometry(0.7, 0.7, 0.2, 8);
        const hatchMaterial = new THREE.MeshStandardMaterial({
            color: 0x3a4d30,
            roughness: 0.5,
            metalness: 0.5
        });
        const hatch = new THREE.Mesh(hatchGeometry, hatchMaterial);
        hatch.position.set(-1, 1, -1.5);
        hatch.castShadow = true;
        hatch.receiveShadow = true;
        this.hull.add(hatch);
    }
    
    /**
     * Create the turret and cannon
     */
    createTurret() {
        // Create turret group
        this.turret = new THREE.Group();
        this.turret.position.set(0, 1.8, 0);
        this.mesh.add(this.turret);
        
        // Turret base
        const turretBaseGeometry = new THREE.CylinderGeometry(1.8, 2, 0.5, 16);
        const turretBaseMaterial = new THREE.MeshStandardMaterial({
            color: 0x4d6b41, // Slightly different green
            roughness: 0.6,
            metalness: 0.3
        });
        const turretBase = new THREE.Mesh(turretBaseGeometry, turretBaseMaterial);
        turretBase.castShadow = true;
        turretBase.receiveShadow = true;
        this.turret.add(turretBase);
        
        // Turret top (dome-like)
        const turretTopGeometry = new THREE.SphereGeometry(1.8, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const turretTopMaterial = new THREE.MeshStandardMaterial({
            color: 0x506d43,
            roughness: 0.7,
            metalness: 0.2
        });
        const turretTop = new THREE.Mesh(turretTopGeometry, turretTopMaterial);
        turretTop.position.set(0, 0.25, 0);
        turretTop.castShadow = true;
        turretTop.receiveShadow = true;
        this.turret.add(turretTop);
        
        // Commander's hatch
        const commanderHatchGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.2, 8);
        const commanderHatchMaterial = new THREE.MeshStandardMaterial({
            color: 0x3a4d30,
            roughness: 0.5,
            metalness: 0.5
        });
        const commanderHatch = new THREE.Mesh(commanderHatchGeometry, commanderHatchMaterial);
        commanderHatch.position.set(0.7, 0.5, -0.3);
        commanderHatch.castShadow = true;
        commanderHatch.receiveShadow = true;
        this.turret.add(commanderHatch);
        
        // Cannon
        this.createCannon();
    }
    
    /**
     * Create the main cannon
     */
    createCannon() {
        const cannonGroup = new THREE.Group();
        cannonGroup.position.set(0, 0, 0);
        this.turret.add(cannonGroup);
        
        // Main gun
        const cannonGeometry = new THREE.CylinderGeometry(0.35, 0.35, 7, 16);
        const cannonMaterial = new THREE.MeshStandardMaterial({
            color: 0x2c2c2c,
            roughness: 0.4,
            metalness: 0.7
        });
        this.cannon = new THREE.Mesh(cannonGeometry, cannonMaterial);
        this.cannon.rotation.x = Math.PI / 2;
        this.cannon.position.set(0, 0.3, 3.5);
        this.cannon.castShadow = true;
        this.cannon.receiveShadow = true;
        cannonGroup.add(this.cannon);
        
        // Barrel reinforcement
        const reinforcementGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.8, 16);
        const reinforcementMaterial = new THREE.MeshStandardMaterial({
            color: 0x3a3a3a,
            roughness: 0.4,
            metalness: 0.7
        });
        const reinforcement = new THREE.Mesh(reinforcementGeometry, reinforcementMaterial);
        reinforcement.rotation.x = Math.PI / 2;
        reinforcement.position.set(0, 0.3, 0.6);
        reinforcement.castShadow = true;
        reinforcement.receiveShadow = true;
        cannonGroup.add(reinforcement);
        
        // Muzzle brake
        const muzzleGeometry = new THREE.CylinderGeometry(0.45, 0.55, 0.5, 16);
        const muzzleMaterial = new THREE.MeshStandardMaterial({
            color: 0x232323,
            roughness: 0.5,
            metalness: 0.8
        });
        const muzzle = new THREE.Mesh(muzzleGeometry, muzzleMaterial);
        muzzle.rotation.x = Math.PI / 2;
        muzzle.position.set(0, 0.3, 6.8);
        muzzle.castShadow = true;
        muzzle.receiveShadow = true;
        cannonGroup.add(muzzle);
    }
    
    /**
     * Create tank tracks
     */
    createTracks() {
        // Track material
        const trackMaterial = new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.9,
            metalness: 0.2
        });
        
        // Left track
        const leftTrackGeometry = new THREE.BoxGeometry(1.2, 1.2, 7.5);
        this.leftTrack = new THREE.Mesh(leftTrackGeometry, trackMaterial);
        this.leftTrack.position.set(-2.1, 0, 0);
        this.leftTrack.castShadow = true;
        this.leftTrack.receiveShadow = true;
        this.mesh.add(this.leftTrack);
        
        // Right track
        const rightTrackGeometry = new THREE.BoxGeometry(1.2, 1.2, 7.5);
        this.rightTrack = new THREE.Mesh(rightTrackGeometry, trackMaterial);
        this.rightTrack.position.set(2.1, 0, 0);
        this.rightTrack.castShadow = true;
        this.rightTrack.receiveShadow = true;
        this.mesh.add(this.rightTrack);
        
        // Add road wheels
        this.addWheels();
    }
    
    /**
     * Add wheels to the tracks
     */
    addWheels() {
        const wheelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1.4, 8);
        const wheelMaterial = new THREE.MeshStandardMaterial({
            color: 0x111111,
            roughness: 0.8,
            metalness: 0.3
        });
        
        // Add wheels to left track
        for (let i = -2; i <= 2; i++) {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(-2.1, 0, i * 1.5);
            wheel.castShadow = true;
            wheel.receiveShadow = true;
            this.mesh.add(wheel);
        }
        
        // Add wheels to right track
        for (let i = -2; i <= 2; i++) {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(2.1, 0, i * 1.5);
            wheel.castShadow = true;
            wheel.receiveShadow = true;
            this.mesh.add(wheel);
        }
    }
    
    /**
     * Create exhaust system
     */
    createExhaustSystem() {
        const exhaustGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.8, 8);
        const exhaustMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.8,
            metalness: 0.7
        });
        
        this.exhaustSystem = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
        this.exhaustSystem.rotation.x = Math.PI / 2;
        this.exhaustSystem.position.set(-1.5, 1.2, 3.2);
        this.exhaustSystem.castShadow = true;
        this.exhaustSystem.receiveShadow = true;
        this.hull.add(this.exhaustSystem);
    }
    
    /**
     * Add miscellaneous details to the tank
     */
    addDetails() {
        // Add antenna
        const antennaGeometry = new THREE.CylinderGeometry(0.05, 0.02, 2.5, 4);
        const antennaMaterial = new THREE.MeshStandardMaterial({
            color: 0x111111,
            roughness: 0.6,
            metalness: 0.5
        });
        const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
        antenna.position.set(1.5, 1, 1);
        antenna.castShadow = true;
        antenna.receiveShadow = true;
        this.turret.add(antenna);
        
        // Add machine gun
        const mgGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1.5, 8);
        const mgMaterial = new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.5,
            metalness: 0.7
        });
        const machineGun = new THREE.Mesh(mgGeometry, mgMaterial);
        machineGun.rotation.x = Math.PI / 4;
        machineGun.position.set(-1.2, 0.8, -0.2);
        machineGun.castShadow = true;
        machineGun.receiveShadow = true;
        this.turret.add(machineGun);
        
        // Add storage boxes
        const boxGeometry = new THREE.BoxGeometry(0.8, 0.5, 1.2);
        const boxMaterial = new THREE.MeshStandardMaterial({
            color: 0x3d5935,
            roughness: 0.8,
            metalness: 0.2
        });
        const storageBox = new THREE.Mesh(boxGeometry, boxMaterial);
        storageBox.position.set(1.8, 1.3, 2);
        storageBox.castShadow = true;
        storageBox.receiveShadow = true;
        this.hull.add(storageBox);
    }
    
    /**
     * Process user input
     * @param {InputManager} inputManager - The input manager
     */
    handleInput(inputManager) {
        // Reset target speed if no keys pressed
        this.targetSpeed = 0;
        
        // Forward/backward movement
        if (inputManager.isKeyPressed('KeyW')) {
            this.targetSpeed = this.maxSpeed;
        } else if (inputManager.isKeyPressed('KeyS')) {
            this.targetSpeed = -this.maxReverseSpeed;
        }
        
        // Rotation (left/right)
        if (inputManager.isKeyPressed('KeyA')) {
            this.mesh.rotation.y += this.rotationSpeed * 0.016; // Approximate for 60fps
        } else if (inputManager.isKeyPressed('KeyD')) {
            this.mesh.rotation.y -= this.rotationSpeed * 0.016;
        }
        
        // Handle firing
        if (inputManager.isKeyPressed('Space') || 
            (inputManager.mousePosition && inputManager.isMouseButtonPressed(0))) {
            this.fire();
        }
        
        // Handle turret rotation based on mouse
        if (inputManager.mousePosition) {
            // This will need to be implemented with raycasting in main.js
            // and passing the desired angle to the tank
        }
    }
    
    /**
     * Update tank physics and animations
     * @param {number} deltaTime - Time since last frame in seconds
     */
    update(deltaTime) {
        if (!this.isAlive) return;
        
        // Update speed with acceleration/deceleration
        if (this.currentSpeed < this.targetSpeed) {
            this.currentSpeed += this.acceleration * deltaTime;
            if (this.currentSpeed > this.targetSpeed) {
                this.currentSpeed = this.targetSpeed;
            }
        } else if (this.currentSpeed > this.targetSpeed) {
            this.currentSpeed -= this.deceleration * deltaTime;
            if (this.currentSpeed < this.targetSpeed) {
                this.currentSpeed = this.targetSpeed;
            }
        }
        
        // Calculate movement direction
        this.direction.set(0, 0, -1).applyQuaternion(this.mesh.quaternion);
        
        // Apply velocity
        this.velocity.copy(this.direction).multiplyScalar(this.currentSpeed * deltaTime);
        this.mesh.position.add(this.velocity);
        
        // Apply simple world boundaries
        if (this.mesh.position.x > 90) this.mesh.position.x = 90;
        if (this.mesh.position.x < -90) this.mesh.position.x = -90;
        if (this.mesh.position.z > 90) this.mesh.position.z = 90;
        if (this.mesh.position.z < -90) this.mesh.position.z = -90;
    }
    
    /**
     * Fire the main cannon
     */
    fire() {
        const now = Date.now();
        
        // Check fire rate cooldown
        if (now - this.lastFireTime < this.fireRate) return;
        
        this.lastFireTime = now;
        this.isFiring = true;
        
        // Create a projectile
        this.createProjectile();
        
        // Cannon recoil animation
        const originalPosition = this.cannon.position.z;
        this.cannon.position.z -= 0.5; // Recoil
        
        // Reset cannon after recoil
        setTimeout(() => {
            if (this.cannon) {
                this.cannon.position.z = originalPosition;
            }
            this.isFiring = false;
        }, 150);
    }
    
    /**
     * Create a projectile when firing
     */
    createProjectile() {
        // Get the cannon's world position and direction
        const cannonWorldPos = new THREE.Vector3();
        const cannonWorldDir = new THREE.Vector3(0, 0, 1);
        
        this.cannon.getWorldPosition(cannonWorldPos);
        cannonWorldDir.applyQuaternion(this.turret.quaternion);
        cannonWorldDir.applyQuaternion(this.mesh.quaternion);
        
        // Adjust position to muzzle of cannon
        cannonWorldPos.add(cannonWorldDir.clone().multiplyScalar(3.5));
        
        // Create projectile geometry
        const projectileGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        const projectileMaterial = new THREE.MeshBasicMaterial({ color: 0xff5500 });
        const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);
        
        // Position at muzzle
        projectile.position.copy(cannonWorldPos);
        
        // Add to scene
        this.scene.addObject(projectile);
        
        // Create muzzle flash effect
        this.createMuzzleFlash(cannonWorldPos, cannonWorldDir);
        
        // Projectile animation
        const speed = 50;
        const lifetime = 3000; // milliseconds
        const startTime = Date.now();
        const startPosition = cannonWorldPos.clone();
        
        // Animation loop
        const animateProjectile = () => {
            const elapsed = Date.now() - startTime;
            
            if (elapsed > lifetime) {
                this.scene.removeObject(projectile);
                return;
            }
            
            projectile.position.add(cannonWorldDir.clone().multiplyScalar(speed * 0.016)); // ~60fps
            
            requestAnimationFrame(animateProjectile);
        };
        
        animateProjectile();
    }
    
    /**
     * Create muzzle flash effect
     * @param {THREE.Vector3} position - World position of muzzle
     * @param {THREE.Vector3} direction - Direction of cannon
     */
    createMuzzleFlash(position, direction) {
        // Simple muzzle flash
        const flashGeometry = new THREE.SphereGeometry(1, 8, 8);
        const flashMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffaa00,
            transparent: true,
            opacity: 0.8
        });
        
        const flash = new THREE.Mesh(flashGeometry, flashMaterial);
        flash.position.copy(position);
        flash.scale.set(0.1, 0.1, 0.1);
        
        this.scene.addObject(flash);
        
        // Animate flash
        let scale = 0.2;
        let opacity = 1.0;
        
        const animateFlash = () => {
            scale += 0.2;
            opacity -= 0.1;
            
            flash.scale.set(scale, scale, scale);
            flashMaterial.opacity = opacity;
            
            if (opacity <= 0) {
                this.scene.removeObject(flash);
                return;
            }
            
            requestAnimationFrame(animateFlash);
        };
        
        animateFlash();
    }
    
    /**
     * Apply damage to the tank
     * @param {number} amount - Amount of damage to apply
     * @returns {number} - Remaining health
     */
    damage(amount) {
        this.health -= amount;
        
        if (this.health <= 0) {
            this.health = 0;
            this.isAlive = false;
            this.destroy();
        }
        
        return this.health;
    }
    
    /**
     * Destroy the tank (explosion effect, etc.)
     */
    destroy() {
        // Create explosion effect
        this.createExplosion();
        
        // Hide tank (could be replaced with damaged model)
        this.mesh.visible = false;
    }
    
    /**
     * Create explosion effect when tank is destroyed
     */
    createExplosion() {
        const position = this.mesh.position.clone();
        position.y += 2;
        
        // Create explosion particles
        const particleCount = 50;
        const particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            const particleGeometry = new THREE.SphereGeometry(Math.random() * 0.5 + 0.1, 8, 8);
            const particleMaterial = new THREE.MeshBasicMaterial({ 
                color: new THREE.Color(0xffaa00),
                transparent: true,
                opacity: 1.0
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.copy(position);
            
            // Random direction
            const direction = new THREE.Vector3(
                Math.random() * 2 - 1,
                Math.random() * 2 - 1,
                Math.random() * 2 - 1
            ).normalize();
            
            // Random speed
            const speed = Math.random() * 10 + 5;
            
            particle.userData = {
                direction: direction,
                speed: speed,
                rotationSpeed: Math.random() * 0.1
            };
            
            this.scene.addObject(particle);
            particles.push(particle);
        }
        
        // Animate particles
        const startTime = Date.now();
        const duration = 2000; // milliseconds
        
        const animateExplosion = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;
            
            if (progress >= 1) {
                // Remove all particles
                particles.forEach(particle => {
                    this.scene.removeObject(particle);
                });
                return;
            }
            
            // Update each particle
            particles.forEach(particle => {
                const userData = particle.userData;
                
                // Move particle
                particle.position.add(
                    userData.direction.clone().multiplyScalar(userData.speed * 0.016)
                );
                
                // Apply gravity
                particle.position.y -= 9.8 * 0.016 * progress * 2;
                
                // Rotate particle
                particle.rotation.x += userData.rotationSpeed;
                particle.rotation.y += userData.rotationSpeed;
                
                // Fade out
                particle.material.opacity = 1 - progress;
                
                // Slow down
                userData.speed *= 0.98;
            });
            
            requestAnimationFrame(animateExplosion);
        };
        
        animateExplosion();
    }
    
    /**
     * Get tank's current position
     * @returns {THREE.Vector3}
     */
    getPosition() {
        return this.mesh.position.clone();
    }
    
    /**
     * Get tank's current rotation
     * @returns {THREE.Euler}
     */
    getRotation() {
        return this.mesh.rotation.clone();
    }
    
    /**
     * Get turret's world quaternion
     * @returns {THREE.Quaternion}
     */
    getTurretQuaternion() {
        const quaternion = new THREE.Quaternion();
        this.turret.getWorldQuaternion(quaternion);
        return quaternion;
    }
    
    /**
     * Set turret rotation directly (used for network sync)
     * @param {number} angle - Rotation angle in radians
     */
    setTurretRotation(angle) {
        this.turret.rotation.y = angle;
    }
    
    /**
     * Clean up resources to prevent memory leaks
     */
    dispose() {
        // Remove from scene
        if (this.scene) {
            this.scene.removeObject(this.mesh);
        }
        
        // Dispose geometries and materials
        this.disposeComponent(this.hull);
        this.disposeComponent(this.turret);
        this.disposeComponent(this.cannon);
        this.disposeComponent(this.leftTrack);
        this.disposeComponent(this.rightTrack);
        this.disposeComponent(this.exhaustSystem);
        
        // Clear references
        this.hull = null;
        this.turret = null;
        this.cannon = null;
        this.leftTrack = null;
        this.rightTrack = null;
        this.exhaustSystem = null;
        this.mesh = null;
        this.scene = null;
    }
    
    /**
     * Helper to dispose a mesh component
     * @param {THREE.Mesh} component - Component to dispose
     */
    disposeComponent(component) {
        if (!component) return;
        
        if (component.geometry) {
            component.geometry.dispose();
        }
        
        if (component.material) {
            if (Array.isArray(component.material)) {
                component.material.forEach(material => material.dispose());
            } else {
                component.material.dispose();
            }
        }
    }
}