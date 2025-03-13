/**
 * Scene management for Urban Tank Warfare
 * Handles 3D environment, lighting, and city layout
 */

// Import Three.js from CDN
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.146.1/build/three.module.js';

/**
 * Scene class to manage the 3D environment
 */
export class Scene {
    /**
     * Initialize scene with container element
     * @param {HTMLElement} container - The container element for the scene
     */
    constructor(container) {
        this.container = container;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();
        this.ambientLight = null;
        this.directionalLight = null;
        this.ground = null;
        this.gridHelper = null;
        this.buildings = [];
        this.dayNightCycle = {
            enabled: true,
            time: 0,
            dayDuration: 300, // seconds for a full day-night cycle
        };
        this.fog = null;
    }

    /**
     * Initialize the scene with all components
     * @returns {Promise} - Resolves when scene is ready
     */
    async init() {
        // Create scene
        this.scene = new THREE.Scene();
        
        // Set up camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(20, 20, 30);
        this.camera.lookAt(0, 0, 0);
        
        // Set up renderer
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.container,
            antialias: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setClearColor(0x121212); // Dark background for night
        
        // Add fog for atmosphere
        this.fog = new THREE.FogExp2(0x333333, 0.005);
        this.scene.fog = this.fog;
        
        // Add lights
        this.addLights();
        
        // Create ground
        this.createGround();
        
        // Generate buildings
        this.generateBuildings();
        
        // Return a promise that resolves when loading is complete
        return new Promise(resolve => {
            // Simulate loading time
            setTimeout(resolve, 500);
        });
    }
    
    /**
     * Add lighting to the scene
     */
    addLights() {
        // Ambient light for general illumination
        this.ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(this.ambientLight);
        
        // Directional light (sun)
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        this.directionalLight.position.set(50, 100, 30);
        this.directionalLight.castShadow = true;
        
        // Configure shadow properties
        this.directionalLight.shadow.mapSize.width = 2048;
        this.directionalLight.shadow.mapSize.height = 2048;
        this.directionalLight.shadow.camera.near = 0.5;
        this.directionalLight.shadow.camera.far = 500;
        this.directionalLight.shadow.camera.left = -100;
        this.directionalLight.shadow.camera.right = 100;
        this.directionalLight.shadow.camera.top = 100;
        this.directionalLight.shadow.camera.bottom = -100;
        
        this.scene.add(this.directionalLight);
    }
    
    /**
     * Create ground plane with grid
     */
    createGround() {
        // Ground plane
        const groundGeometry = new THREE.PlaneGeometry(200, 200, 32, 32);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            roughness: 0.8,
            metalness: 0.2
        });
        this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.receiveShadow = true;
        this.scene.add(this.ground);
        
        // Grid helper for reference
        this.gridHelper = new THREE.GridHelper(200, 40, 0x444444, 0x888888);
        this.gridHelper.position.y = 0.01; // Slightly above ground to prevent z-fighting
        this.scene.add(this.gridHelper);
    }
    
    /**
     * Generate city buildings
     */
    generateBuildings() {
        // City parameters
        const citySize = 100;
        const blockSize = 20;
        const buildingColors = [
            0x8A8A8A, 0x787878, 0x696969, 
            0x909090, 0xA0A0A0, 0xB0B0B0
        ];
        
        // Create buildings in a grid pattern
        for (let x = -citySize/2; x < citySize/2; x += blockSize) {
            for (let z = -citySize/2; z < citySize/2; z += blockSize) {
                // Skip center area for player spawn
                if (Math.abs(x) < 20 && Math.abs(z) < 20) continue;
                
                // Create 1-3 buildings per block
                const buildingsPerBlock = 1 + Math.floor(Math.random() * 3);
                
                for (let i = 0; i < buildingsPerBlock; i++) {
                    // Random building properties
                    const width = 5 + Math.random() * 8;
                    const height = 10 + Math.random() * 30;
                    const depth = 5 + Math.random() * 8;
                    
                    // Create building geometry and material
                    const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
                    const colorIndex = Math.floor(Math.random() * buildingColors.length);
                    const buildingMaterial = new THREE.MeshStandardMaterial({ 
                        color: buildingColors[colorIndex],
                        roughness: 0.7,
                        metalness: 0.2
                    });
                    
                    // Create building mesh
                    const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
                    
                    // Position within the block (with some randomness)
                    const offsetX = (Math.random() - 0.5) * (blockSize - width);
                    const offsetZ = (Math.random() - 0.5) * (blockSize - depth);
                    
                    building.position.set(
                        x + offsetX, 
                        height / 2, 
                        z + offsetZ
                    );
                    
                    // Add shadows
                    building.castShadow = true;
                    building.receiveShadow = true;
                    
                    // Add to scene and store reference
                    this.scene.add(building);
                    this.buildings.push(building);
                }
            }
        }
    }
    
    /**
     * Update scene for animation
     * @param {number} deltaTime - Time since last frame in seconds
     */
    update(deltaTime) {
        // Update day-night cycle if enabled
        if (this.dayNightCycle.enabled) {
            this.updateDayNightCycle(deltaTime);
        }
        
        // Render the scene
        this.renderer.render(this.scene, this.camera);
    }
    
    /**
     * Update day-night cycle
     * @param {number} deltaTime - Time since last frame in seconds
     */
    updateDayNightCycle(deltaTime) {
        // Update time
        this.dayNightCycle.time += deltaTime;
        if (this.dayNightCycle.time > this.dayNightCycle.dayDuration) {
            this.dayNightCycle.time = 0;
        }
        
        // Calculate time of day (0-1)
        const timeOfDay = this.dayNightCycle.time / this.dayNightCycle.dayDuration;
        
        // Calculate sun position for simple day-night cycle
        const angleRadians = timeOfDay * Math.PI * 2;
        const sunX = Math.cos(angleRadians) * 100;
        const sunY = Math.sin(angleRadians) * 100;
        this.directionalLight.position.set(sunX, Math.max(0, sunY), 0);
        
        // Adjust light intensity based on time of day
        const intensity = Math.max(0.1, Math.sin(timeOfDay * Math.PI));
        this.directionalLight.intensity = intensity;
        
        // Adjust ambient light intensity
        this.ambientLight.intensity = 0.3 + (intensity * 0.3);
        
        // Adjust fog color based on time of day
        const fogHue = Math.round(timeOfDay * 255);
        this.fog.color.setRGB(
            fogHue / 255 * 0.5,
            fogHue / 255 * 0.5,
            fogHue / 255 * 0.6
        );
    }
    
    /**
     * Handle window resize
     * @param {number} width - New width
     * @param {number} height - New height
     */
    resize(width, height) {
        if (!this.camera || !this.renderer) return;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
    
    /**
     * Get the Three.js scene
     * @returns {THREE.Scene}
     */
    getScene() {
        return this.scene;
    }
    
    /**
     * Get the camera
     * @returns {THREE.Camera}
     */
    getCamera() {
        return this.camera;
    }
    
    /**
     * Add an object to the scene
     * @param {THREE.Object3D} object - Object to add
     */
    addObject(object) {
        if (this.scene) {
            this.scene.add(object);
        }
    }
    
    /**
     * Remove an object from the scene
     * @param {THREE.Object3D} object - Object to remove
     */
    removeObject(object) {
        if (this.scene) {
            this.scene.remove(object);
        }
    }
    
    /**
     * Clean up resources to prevent memory leaks
     */
    dispose() {
        // Remove all buildings
        for (const building of this.buildings) {
            if (building.geometry) building.geometry.dispose();
            if (building.material) building.material.dispose();
            this.scene.remove(building);
        }
        
        // Dispose ground
        if (this.ground) {
            if (this.ground.geometry) this.ground.geometry.dispose();
            if (this.ground.material) this.ground.material.dispose();
            this.scene.remove(this.ground);
        }
        
        // Remove grid helper
        if (this.gridHelper) {
            this.scene.remove(this.gridHelper);
        }
        
        // Clear references
        this.buildings = [];
        this.ground = null;
        this.gridHelper = null;
        
        // Clear scene
        while(this.scene.children.length > 0) { 
            const object = this.scene.children[0];
            if (object.geometry) object.geometry.dispose();
            if (object.material) object.material.dispose();
            this.scene.remove(object); 
        }
        
        // Stop animation loop
        this.clock.stop();
    }
}