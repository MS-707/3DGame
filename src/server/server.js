/**
 * Urban Tank Warfare - Multiplayer Game Server
 * Handles player connections, game state, and multiplayer synchronization
 */

import express from 'express';
import http from 'http';
import { Server as WebSocketServer } from 'socket.io';
import * as Constants from '../shared/constants.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

// Initialize Express app and HTTP server
const app = express();
const server = http.createServer(app);
const io = new WebSocketServer(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Game state
const gameState = {
    players: {},
    bullets: {},
    powerups: {},
    gameStatus: Constants.GAME_STATES.LOBBY,
    startTime: null,
    lastUpdateTime: Date.now()
};

// Serve static files
app.use(express.static(path.join(rootDir, 'public')));

// Handle root route
app.get('/', (req, res) => {
    res.sendFile(path.join(rootDir, 'public', 'index.html'));
});

/**
 * Generate a random spawn position away from other players
 * @returns {Object} Position {x, y, z}
 */
function getRandomSpawnPosition() {
    const mapSize = Constants.SERVER_CONFIG.MAP_SIZE;
    const halfMapSize = mapSize / 2;
    
    // Try up to 10 times to find a position away from other players
    for (let i = 0; i < 10; i++) {
        const position = {
            x: (Math.random() * mapSize) - halfMapSize,
            y: 1, // Tank height off ground
            z: (Math.random() * mapSize) - halfMapSize
        };
        
        // Skip center area
        if (Math.abs(position.x) < 20 && Math.abs(position.z) < 20) {
            continue;
        }
        
        // Check if position is far enough from other players
        let isFarEnough = true;
        for (const playerId in gameState.players) {
            const player = gameState.players[playerId];
            const dx = player.position.x - position.x;
            const dz = player.position.z - position.z;
            const distanceSquared = dx * dx + dz * dz;
            
            if (distanceSquared < 400) { // 20 units away
                isFarEnough = false;
                break;
            }
        }
        
        if (isFarEnough) {
            return position;
        }
    }
    
    // Fallback to random position if can't find one away from others
    return {
        x: (Math.random() * mapSize) - halfMapSize,
        y: 1,
        z: (Math.random() * mapSize) - halfMapSize
    };
}

/**
 * Add a new player to the game
 * @param {string} playerId - Socket ID of the player
 * @returns {Object} - Player data
 */
function addPlayer(playerId) {
    const position = getRandomSpawnPosition();
    
    gameState.players[playerId] = {
        id: playerId,
        position: position,
        rotation: { y: 0 },
        turretRotation: { y: 0 },
        health: Constants.GAMEPLAY.TANK_HEALTH,
        score: 0,
        lastShotTime: 0,
        respawnTime: 0,
        isAlive: true
    };
    
    return gameState.players[playerId];
}

/**
 * Handle player shooting
 * @param {string} playerId - ID of player who shot
 * @param {Object} data - Shot data
 */
function handlePlayerShot(playerId, data) {
    const player = gameState.players[playerId];
    if (!player || !player.isAlive) return;
    
    const now = Date.now();
    if (now - player.lastShotTime < Constants.GAMEPLAY.RELOAD_TIME) {
        return; // Can't shoot yet
    }
    
    player.lastShotTime = now;
    
    // Create bullet
    const bulletId = `bullet_${playerId}_${now}`;
    gameState.bullets[bulletId] = {
        id: bulletId,
        playerId: playerId,
        position: { ...data.position },
        direction: { ...data.direction },
        createdAt: now,
        damage: Constants.GAMEPLAY.BULLET_DAMAGE
    };
    
    // Broadcast the shot
    io.emit(Constants.NETWORK_MESSAGE_TYPES.PLAYER_SHOT, {
        id: playerId,
        bulletId: bulletId,
        position: data.position,
        direction: data.direction
    });
}

/**
 * Update game state
 */
function updateGameState() {
    const now = Date.now();
    const deltaTime = (now - gameState.lastUpdateTime) / 1000; // in seconds
    gameState.lastUpdateTime = now;
    
    // Update bullets
    for (const bulletId in gameState.bullets) {
        const bullet = gameState.bullets[bulletId];
        
        // Check bullet lifetime
        if (now - bullet.createdAt > Constants.GAME_PHYSICS.BULLET_LIFETIME) {
            delete gameState.bullets[bulletId];
            continue;
        }
        
        // Move bullet
        bullet.position.x += bullet.direction.x * Constants.GAME_PHYSICS.BULLET_SPEED * deltaTime;
        bullet.position.z += bullet.direction.z * Constants.GAME_PHYSICS.BULLET_SPEED * deltaTime;
        
        // Check collisions with players
        for (const playerId in gameState.players) {
            const player = gameState.players[playerId];
            
            // Skip the player who shot the bullet or dead players
            if (playerId === bullet.playerId || !player.isAlive) continue;
            
            // Simple collision check
            const dx = player.position.x - bullet.position.x;
            const dz = player.position.z - bullet.position.z;
            const distanceSquared = dx * dx + dz * dz;
            
            if (distanceSquared < 25) { // 5 units radius
                // Player hit!
                player.health -= bullet.damage;
                
                // Check if player died
                if (player.health <= 0) {
                    player.health = 0;
                    player.isAlive = false;
                    player.respawnTime = now + Constants.GAMEPLAY.RESPAWN_TIME;
                    
                    // Award a point to the shooter
                    if (gameState.players[bullet.playerId]) {
                        gameState.players[bullet.playerId].score += 1;
                    }
                    
                    // Broadcast player died
                    io.emit(Constants.NETWORK_MESSAGE_TYPES.PLAYER_HIT, {
                        id: playerId,
                        damage: bullet.damage,
                        health: player.health,
                        killed: true,
                        killerId: bullet.playerId
                    });
                } else {
                    // Broadcast player hit
                    io.emit(Constants.NETWORK_MESSAGE_TYPES.PLAYER_HIT, {
                        id: playerId,
                        damage: bullet.damage,
                        health: player.health,
                        killed: false
                    });
                }
                
                // Remove bullet
                delete gameState.bullets[bulletId];
                break;
            }
        }
    }
    
    // Check for respawns
    for (const playerId in gameState.players) {
        const player = gameState.players[playerId];
        
        if (!player.isAlive && now >= player.respawnTime) {
            player.isAlive = true;
            player.health = Constants.GAMEPLAY.TANK_HEALTH;
            player.position = getRandomSpawnPosition();
            
            // Broadcast respawn
            io.emit(Constants.NETWORK_MESSAGE_TYPES.PLAYER_RESPAWN, {
                id: playerId,
                position: player.position,
                health: player.health
            });
        }
    }
    
    // Send game state update to all clients
    io.emit(Constants.NETWORK_MESSAGE_TYPES.GAME_STATE, {
        players: gameState.players,
        bullets: gameState.bullets,
        powerups: gameState.powerups
    });
}

// Set up Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);
    
    // Add player to game
    const player = addPlayer(socket.id);
    
    // Notify all clients of new player
    io.emit(Constants.NETWORK_MESSAGE_TYPES.PLAYER_JOINED, player);
    
    // Send current game state to the new player
    socket.emit(Constants.NETWORK_MESSAGE_TYPES.GAME_STATE, {
        players: gameState.players,
        bullets: gameState.bullets,
        powerups: gameState.powerups,
        gameStatus: gameState.gameStatus
    });

    // Handle player movement
    socket.on(Constants.NETWORK_MESSAGE_TYPES.PLAYER_MOVED, (data) => {
        const player = gameState.players[socket.id];
        if (player && player.isAlive) {
            player.position = data.position;
            player.rotation = data.rotation;
            player.turretRotation = data.turretRotation;
            
            // Broadcast to other players only (optimization)
            socket.broadcast.emit(Constants.NETWORK_MESSAGE_TYPES.PLAYER_MOVED, {
                id: socket.id,
                position: data.position,
                rotation: data.rotation,
                turretRotation: data.turretRotation
            });
        }
    });

    // Handle player shooting
    socket.on(Constants.NETWORK_MESSAGE_TYPES.PLAYER_SHOT, (data) => {
        handlePlayerShot(socket.id, data);
    });
    
    // Handle chat messages
    socket.on(Constants.NETWORK_MESSAGE_TYPES.CHAT_MESSAGE, (data) => {
        // Add player information to message
        const message = {
            id: socket.id,
            text: data.text,
            timestamp: Date.now()
        };
        
        // Broadcast message to all players
        io.emit(Constants.NETWORK_MESSAGE_TYPES.CHAT_MESSAGE, message);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);
        
        // Remove player from game state
        delete gameState.players[socket.id];
        
        // Notify all clients
        io.emit(Constants.NETWORK_MESSAGE_TYPES.PLAYER_LEFT, { id: socket.id });
    });
});

// Start game update loop
setInterval(updateGameState, 1000 / Constants.SERVER_CONFIG.UPDATE_RATE);

// Start the server
const PORT = process.env.PORT || Constants.SERVER_CONFIG.PORT;
server.listen(PORT, () => {
    console.log(`Urban Tank Warfare server running on http://localhost:${PORT}`);
});