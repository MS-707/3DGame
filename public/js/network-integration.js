/**
 * Network integration example for Urban Tank Warfare
 * This demonstrates how to use the NetworkManager with the game
 */

import { Scene } from './scene.js';
import { Tank } from './tank.js';
import { InputManager } from './input.js';
import { CameraController } from './camera.js';
import { NetworkManager } from './network.js';
import { NETWORK_MESSAGE_TYPES } from './constants.js';

/**
 * Example of integrating the NetworkManager with the game
 */
export function setupNetworking(gameScene, localTank, inputManager) {
    // Initialize network manager
    const networkManager = new NetworkManager();
    
    // Connection status indicator
    const connectionStatus = document.createElement('div');
    connectionStatus.style.position = 'absolute';
    connectionStatus.style.top = '10px';
    connectionStatus.style.right = '10px';
    connectionStatus.style.padding = '5px 10px';
    connectionStatus.style.backgroundColor = 'rgba(0,0,0,0.5)';
    connectionStatus.style.color = '#fff';
    connectionStatus.style.fontFamily = 'Arial, sans-serif';
    connectionStatus.style.borderRadius = '5px';
    connectionStatus.textContent = 'Connecting...';
    document.body.appendChild(connectionStatus);
    
    // Latency display
    const latencyDisplay = document.createElement('div');
    latencyDisplay.style.position = 'absolute';
    latencyDisplay.style.top = '40px';
    latencyDisplay.style.right = '10px';
    latencyDisplay.style.padding = '5px 10px';
    latencyDisplay.style.backgroundColor = 'rgba(0,0,0,0.5)';
    latencyDisplay.style.color = '#fff';
    latencyDisplay.style.fontFamily = 'Arial, sans-serif';
    latencyDisplay.style.borderRadius = '5px';
    latencyDisplay.textContent = 'Ping: --ms';
    document.body.appendChild(latencyDisplay);
    
    // Enable debug mode during development
    networkManager.setDebugMode(true, { 
        showLatency: true,
        simulateLatency: 0,  // Set to a value like 200 to test with artificial latency
        packetLoss: 0        // Set to a value like 0.1 to test with 10% packet loss
    });
    
    // Dictionary to store remote tank objects
    const remoteTanks = {};
    
    // Connect to the server
    const serverUrl = 'ws://localhost:3000'; // Replace with actual server URL
    networkManager.connect(serverUrl)
        .then(() => {
            connectionStatus.textContent = 'Connected';
            connectionStatus.style.backgroundColor = 'rgba(0,128,0,0.5)';
        })
        .catch(error => {
            connectionStatus.textContent = 'Connection Failed';
            connectionStatus.style.backgroundColor = 'rgba(255,0,0,0.5)';
            console.error('Failed to connect:', error);
        });
    
    // Update latency display
    setInterval(() => {
        if (networkManager.isConnected()) {
            latencyDisplay.textContent = `Ping: ${networkManager.getLatency()}ms`;
        } else {
            latencyDisplay.textContent = 'Ping: --ms';
        }
    }, 1000);
    
    // Handle game state updates
    networkManager.onGameState((state) => {
        // Update all remote tanks
        for (const playerId in state.players) {
            // Skip local player
            if (playerId === networkManager.playerId) continue;
            
            const playerData = state.players[playerId];
            
            // Create tank if it doesn't exist
            if (!remoteTanks[playerId]) {
                createRemoteTank(playerId, playerData);
            }
            
            // Update tank
            updateRemoteTank(playerId, playerData);
        }
        
        // Remove tanks that are no longer in the game state
        for (const playerId in remoteTanks) {
            if (!state.players[playerId]) {
                removeRemoteTank(playerId);
            }
        }
    });
    
    // Handle player joined
    networkManager.onPlayerJoined((playerData) => {
        console.log('Player joined:', playerData);
        
        // Skip if this is the local player or tank already exists
        if (playerData.id === networkManager.playerId || remoteTanks[playerData.id]) return;
        
        // Create new tank for the player
        createRemoteTank(playerData.id, playerData);
    });
    
    // Handle player left
    networkManager.onPlayerLeft((playerData) => {
        console.log('Player left:', playerData);
        removeRemoteTank(playerData.id);
    });
    
    // Handle player movement updates
    networkManager.onPlayerMoved((moveData) => {
        // Skip if this is the local player
        if (moveData.id === networkManager.playerId) return;
        
        // Update tank position
        if (remoteTanks[moveData.id]) {
            updateRemoteTank(moveData.id, moveData);
        }
    });
    
    // Handle player shots
    networkManager.onPlayerShot((shotData) => {
        // Skip if this is the local player (already handled locally)
        if (shotData.id === networkManager.playerId) return;
        
        // Create visual effect for the shot
        if (remoteTanks[shotData.id]) {
            // Simulate firing from the remote tank
            remoteTanks[shotData.id].fire();
        }
    });
    
    // Handle player hit
    networkManager.onPlayerHit((hitData) => {
        // If local player was hit
        if (hitData.id === networkManager.playerId) {
            // Update local tank health
            localTank.damage(hitData.damage);
            
            // Add screen shake effect
            gameScene.camera.shakeCamera(0.3, 0.5);
        }
    });
    
    // Handle disconnection
    networkManager.onDisconnect(() => {
        connectionStatus.textContent = 'Disconnected';
        connectionStatus.style.backgroundColor = 'rgba(255,0,0,0.5)';
        
        // Clear all remote tanks
        for (const playerId in remoteTanks) {
            removeRemoteTank(playerId);
        }
    });
    
    // Create a remote tank
    function createRemoteTank(playerId, playerData) {
        // Create tank object
        const position = { 
            x: playerData.position?.x || 0, 
            y: playerData.position?.y || 0, 
            z: playerData.position?.z || 0 
        };
        
        const tank = new Tank(gameScene, position);
        remoteTanks[playerId] = tank;
        
        // Set different color for remote tanks
        if (tank.hull && tank.hull.material) {
            tank.hull.material.color.set(0x8866aa);
        }
    }
    
    // Update a remote tank
    function updateRemoteTank(playerId, playerData) {
        const tank = remoteTanks[playerId];
        if (!tank) return;
        
        // Update position if provided
        if (playerData.position) {
            tank.mesh.position.set(
                playerData.position.x,
                playerData.position.y,
                playerData.position.z
            );
        }
        
        // Update rotation if provided
        if (playerData.rotation) {
            tank.mesh.rotation.set(
                playerData.rotation.x,
                playerData.rotation.y,
                playerData.rotation.z
            );
        }
        
        // Update turret rotation if provided
        if (playerData.turretRotation && tank.turret) {
            tank.setTurretRotation(playerData.turretRotation.y);
        }
        
        // Update health status if provided
        if (playerData.health !== undefined && tank.health !== undefined) {
            tank.health = playerData.health;
            
            // Show destruction effect if health is zero
            if (playerData.health <= 0 && tank.isAlive) {
                tank.isAlive = false;
                tank.destroy();
            }
        }
    }
    
    // Remove a remote tank
    function removeRemoteTank(playerId) {
        const tank = remoteTanks[playerId];
        if (!tank) return;
        
        // Remove from scene
        tank.dispose();
        
        // Remove from dictionary
        delete remoteTanks[playerId];
    }
    
    // Update loop for sending player input
    function updateNetworking() {
        if (!networkManager.isConnected()) return;
        
        // Send player input state
        if (localTank && inputManager) {
            const inputState = {
                horizontal: inputManager.getAxis('horizontal'),
                vertical: inputManager.getAxis('vertical'),
                mouseX: inputManager.getAxis('mouseX'),
                mouseY: inputManager.getAxis('mouseY')
            };
            
            networkManager.sendInput({
                input: inputState,
                position: {
                    x: localTank.mesh.position.x,
                    y: localTank.mesh.position.y,
                    z: localTank.mesh.position.z
                },
                rotation: {
                    y: localTank.mesh.rotation.y
                },
                turretRotation: {
                    y: localTank.turret ? localTank.turret.rotation.y : 0
                }
            });
        }
        
        // Request next frame update
        requestAnimationFrame(updateNetworking);
    }
    
    // Start network update loop
    updateNetworking();
    
    // Add fire event
    if (localTank) {
        // Monkey patch fire method to add network event
        const originalFire = localTank.fire;
        localTank.fire = function() {
            // Call original method
            originalFire.call(localTank);
            
            // Send network event
            if (networkManager.isConnected()) {
                networkManager.sendShot({
                    position: {
                        x: localTank.mesh.position.x,
                        y: localTank.mesh.position.y,
                        z: localTank.mesh.position.z
                    },
                    direction: {
                        x: Math.sin(localTank.turret.rotation.y),
                        y: 0,
                        z: Math.cos(localTank.turret.rotation.y)
                    }
                });
            }
        };
    }
    
    return networkManager;
}