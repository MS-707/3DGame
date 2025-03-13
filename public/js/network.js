/**
 * Network manager for Urban Tank Warfare
 * Handles multiplayer communication and game state synchronization
 */

import { NETWORK_MESSAGE_TYPES } from './constants.js';

export class NetworkManager {
    /**
     * Initialize the network manager
     */
    constructor() {
        // Core properties
        this.socket = null;
        this.serverUrl = '';
        this.connected = false;
        
        // Player information
        this.playerId = null;
        this.players = {};
        
        // Connection status
        this.connectionAttempts = 0;
        this.maxConnectionAttempts = 5;
        this.reconnectDelay = 3000; // ms
        
        // Callback registry
        this.callbacks = {
            gameState: [],
            playerJoined: [],
            playerLeft: [],
            playerMoved: [],
            playerShot: [],
            playerHit: [],
            playerRespawn: [],
            chatMessage: [],
            error: [],
            connect: [],
            disconnect: []
        };
        
        // Network performance monitoring
        this.latency = 0;
        this.lastPingTime = 0;
        this.pingInterval = null;
        this.pingFrequency = 5000; // ms
        
        // Input buffering
        this.inputBuffer = [];
        this.lastInputTime = 0;
        this.inputThrottleTime = 50; // ms
        
        // Client-side prediction
        this.pendingActions = new Map(); // Map of action IDs to timestamps
        this.predictionEnabled = true;
        this.clientSequence = 0;
        this.serverSequence = 0;
        
        // Debug options
        this.debug = {
            logMessages: false,
            showLatency: true,
            simulateLatency: 0, // ms
            packetLoss: 0 // 0-1 probability
        };
    }
    
    /**
     * Connect to the game server
     * @param {string} serverUrl - The WebSocket server URL
     * @returns {Promise} - Resolves when connected or rejects on failure
     */
    connect(serverUrl) {
        return new Promise((resolve, reject) => {
            if (this.connected) {
                console.warn('Already connected to server');
                resolve();
                return;
            }
            
            this.serverUrl = serverUrl;
            this.connectionAttempts++;
            
            try {
                this.socket = new WebSocket(serverUrl);
                
                // Connection opened
                this.socket.addEventListener('open', (event) => {
                    console.log('Connected to server');
                    this.connected = true;
                    this.connectionAttempts = 0;
                    
                    // Start measuring latency
                    this.startPingMeasurement();
                    
                    // Trigger connect callbacks
                    this.triggerCallbacks('connect', { timestamp: Date.now() });
                    
                    resolve();
                });
                
                // Listen for messages
                this.socket.addEventListener('message', (event) => {
                    this.handleMessage(event.data);
                });
                
                // Connection closed
                this.socket.addEventListener('close', (event) => {
                    this.handleDisconnect(event.code, event.reason);
                    reject(new Error(`Disconnected: ${event.reason}`));
                });
                
                // Connection error
                this.socket.addEventListener('error', (error) => {
                    console.error('WebSocket error:', error);
                    this.triggerCallbacks('error', { message: 'Connection error', timestamp: Date.now() });
                    
                    this.handleDisconnect(0, 'Connection error');
                    reject(error);
                });
            } catch (error) {
                console.error('Failed to connect to server:', error);
                this.handleDisconnect(0, 'Failed to connect');
                reject(error);
            }
        });
    }
    
    /**
     * Disconnect from the server
     */
    disconnect() {
        if (!this.connected || !this.socket) return;
        
        // Stop ping measurement
        this.stopPingMeasurement();
        
        // Close the socket
        this.socket.close(1000, 'Client disconnected');
        this.connected = false;
        this.socket = null;
        
        console.log('Disconnected from server');
    }
    
    /**
     * Handle disconnect event and attempt reconnection
     * @param {number} code - Disconnect code
     * @param {string} reason - Disconnect reason
     */
    handleDisconnect(code, reason) {
        this.connected = false;
        this.stopPingMeasurement();
        
        console.log(`Disconnected from server: ${code} - ${reason}`);
        
        // Trigger disconnect callbacks
        this.triggerCallbacks('disconnect', { code, reason, timestamp: Date.now() });
        
        // Attempt reconnection if not explicitly closed by client
        if (code !== 1000 && this.connectionAttempts < this.maxConnectionAttempts) {
            console.log(`Attempting to reconnect in ${this.reconnectDelay / 1000} seconds...`);
            
            setTimeout(() => {
                this.connect(this.serverUrl).catch(error => {
                    console.error('Reconnection failed:', error);
                });
            }, this.reconnectDelay);
            
            // Increase delay for next attempt (exponential backoff)
            this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 30000);
        } else if (this.connectionAttempts >= this.maxConnectionAttempts) {
            console.error('Max reconnection attempts reached. Please try again later.');
            this.triggerCallbacks('error', { 
                message: 'Max reconnection attempts reached', 
                timestamp: Date.now() 
            });
        }
    }
    
    /**
     * Handle incoming message from server
     * @param {string} data - Message data as string
     */
    handleMessage(data) {
        let message;
        
        try {
            message = JSON.parse(data);
        } catch (error) {
            console.error('Failed to parse message:', error);
            return;
        }
        
        if (this.debug.logMessages) {
            console.log('Received message:', message);
        }
        
        // Handle different message types
        switch (message.type) {
            case NETWORK_MESSAGE_TYPES.GAME_STATE:
                this.serverSequence = message.sequence || 0;
                this.reconcileGameState(message.data);
                this.triggerCallbacks('gameState', message.data);
                break;
                
            case NETWORK_MESSAGE_TYPES.PLAYER_JOINED:
                this.handlePlayerJoined(message.data);
                break;
                
            case NETWORK_MESSAGE_TYPES.PLAYER_LEFT:
                this.handlePlayerLeft(message.data);
                break;
                
            case NETWORK_MESSAGE_TYPES.PLAYER_MOVED:
                this.triggerCallbacks('playerMoved', message.data);
                break;
                
            case NETWORK_MESSAGE_TYPES.PLAYER_SHOT:
                this.triggerCallbacks('playerShot', message.data);
                break;
                
            case NETWORK_MESSAGE_TYPES.PLAYER_HIT:
                this.triggerCallbacks('playerHit', message.data);
                break;
                
            case NETWORK_MESSAGE_TYPES.PLAYER_RESPAWN:
                this.triggerCallbacks('playerRespawn', message.data);
                break;
                
            case NETWORK_MESSAGE_TYPES.CHAT_MESSAGE:
                this.triggerCallbacks('chatMessage', message.data);
                break;
                
            case 'pong':
                this.handlePong(message);
                break;
                
            case 'player_id':
                this.playerId = message.id;
                console.log(`Assigned player ID: ${this.playerId}`);
                break;
                
            default:
                console.warn('Unknown message type:', message.type);
        }
    }
    
    /**
     * Handle player joined message
     * @param {Object} playerData - Player data
     */
    handlePlayerJoined(playerData) {
        // Store player in local players map
        this.players[playerData.id] = playerData;
        
        // If this is the local player, store the ID
        if (playerData.isLocal) {
            this.playerId = playerData.id;
        }
        
        // Trigger callbacks
        this.triggerCallbacks('playerJoined', playerData);
    }
    
    /**
     * Handle player left message
     * @param {Object} playerData - Player data
     */
    handlePlayerLeft(playerData) {
        // Remove player from local players map
        delete this.players[playerData.id];
        
        // Trigger callbacks
        this.triggerCallbacks('playerLeft', playerData);
    }
    
    /**
     * Reconcile game state with local predictions
     * @param {Object} gameState - Game state from server
     */
    reconcileGameState(gameState) {
        if (!this.predictionEnabled) return;
        
        // Clear old pending actions
        const now = Date.now();
        this.pendingActions.forEach((timestamp, actionId) => {
            if (now - timestamp > 5000) { // Remove actions older than 5 seconds
                this.pendingActions.delete(actionId);
            }
        });
        
        // TODO: Implement actual reconciliation logic when needed
    }
    
    /**
     * Send player input to server
     * @param {Object} inputState - Player input state
     */
    sendInput(inputState) {
        if (!this.connected) return;
        
        const now = Date.now();
        
        // Throttle input updates
        if (now - this.lastInputTime < this.inputThrottleTime) {
            this.inputBuffer = inputState; // Store latest input for next send
            return;
        }
        
        this.lastInputTime = now;
        
        // Use buffered input if available, otherwise use provided input
        const input = this.inputBuffer || inputState;
        this.inputBuffer = null;
        
        // Add sequence number for client-side prediction
        const actionId = ++this.clientSequence;
        this.pendingActions.set(actionId, now);
        
        // Send input update
        this.sendMessage(NETWORK_MESSAGE_TYPES.PLAYER_MOVED, {
            input: input,
            sequence: actionId,
            timestamp: now
        });
    }
    
    /**
     * Send a shot event to server
     * @param {Object} shotData - Shot data including direction, position, etc.
     */
    sendShot(shotData) {
        if (!this.connected) return;
        
        this.sendMessage(NETWORK_MESSAGE_TYPES.PLAYER_SHOT, {
            ...shotData,
            timestamp: Date.now()
        });
    }
    
    /**
     * Send a chat message
     * @param {string} text - Message text
     */
    sendChatMessage(text) {
        if (!this.connected) return;
        
        this.sendMessage(NETWORK_MESSAGE_TYPES.CHAT_MESSAGE, {
            text: text,
            timestamp: Date.now()
        });
    }
    
    /**
     * Send a message to the server
     * @param {string} type - Message type
     * @param {Object} data - Message data
     */
    sendMessage(type, data) {
        if (!this.connected || !this.socket) return;
        
        // Simulate packet loss for testing
        if (this.debug.packetLoss > 0 && Math.random() < this.debug.packetLoss) {
            if (this.debug.logMessages) {
                console.log(`Simulated packet loss for message type: ${type}`);
            }
            return;
        }
        
        const message = JSON.stringify({
            type: type,
            data: data
        });
        
        if (this.debug.logMessages) {
            console.log('Sending message:', { type, data });
        }
        
        // Simulate latency for testing
        if (this.debug.simulateLatency > 0) {
            setTimeout(() => {
                this.socket.send(message);
            }, this.debug.simulateLatency);
        } else {
            this.socket.send(message);
        }
    }
    
    /**
     * Start measuring ping/latency
     */
    startPingMeasurement() {
        this.stopPingMeasurement(); // Clear any existing interval
        
        this.pingInterval = setInterval(() => {
            this.lastPingTime = Date.now();
            this.sendMessage('ping', { timestamp: this.lastPingTime });
        }, this.pingFrequency);
    }
    
    /**
     * Stop measuring ping/latency
     */
    stopPingMeasurement() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }
    
    /**
     * Handle pong response for latency measurement
     * @param {Object} message - Pong message
     */
    handlePong(message) {
        const now = Date.now();
        this.latency = now - (message.timestamp || this.lastPingTime);
        
        if (this.debug.showLatency) {
            console.log(`Current latency: ${this.latency}ms`);
        }
    }
    
    /**
     * Register a callback for a specific event
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    on(event, callback) {
        if (!this.callbacks[event]) {
            this.callbacks[event] = [];
        }
        
        this.callbacks[event].push(callback);
    }
    
    /**
     * Remove a callback for a specific event
     * @param {string} event - Event name
     * @param {Function} callback - Callback function to remove
     */
    off(event, callback) {
        if (!this.callbacks[event]) return;
        
        this.callbacks[event] = this.callbacks[event].filter(cb => cb !== callback);
    }
    
    /**
     * Trigger all callbacks for an event
     * @param {string} event - Event name
     * @param {Object} data - Event data
     */
    triggerCallbacks(event, data) {
        if (!this.callbacks[event]) return;
        
        for (const callback of this.callbacks[event]) {
            callback(data);
        }
    }
    
    /**
     * Register a callback for game state updates
     * @param {Function} callback - Callback function
     */
    onGameState(callback) {
        this.on('gameState', callback);
    }
    
    /**
     * Register a callback for player joined events
     * @param {Function} callback - Callback function
     */
    onPlayerJoined(callback) {
        this.on('playerJoined', callback);
    }
    
    /**
     * Register a callback for player left events
     * @param {Function} callback - Callback function
     */
    onPlayerLeft(callback) {
        this.on('playerLeft', callback);
    }
    
    /**
     * Register a callback for player moved events
     * @param {Function} callback - Callback function
     */
    onPlayerMoved(callback) {
        this.on('playerMoved', callback);
    }
    
    /**
     * Register a callback for player shot events
     * @param {Function} callback - Callback function
     */
    onPlayerShot(callback) {
        this.on('playerShot', callback);
    }
    
    /**
     * Register a callback for player hit events
     * @param {Function} callback - Callback function
     */
    onPlayerHit(callback) {
        this.on('playerHit', callback);
    }
    
    /**
     * Register a callback for player respawn events
     * @param {Function} callback - Callback function
     */
    onPlayerRespawn(callback) {
        this.on('playerRespawn', callback);
    }
    
    /**
     * Register a callback for chat messages
     * @param {Function} callback - Callback function
     */
    onChatMessage(callback) {
        this.on('chatMessage', callback);
    }
    
    /**
     * Register a callback for connection events
     * @param {Function} callback - Callback function
     */
    onConnect(callback) {
        this.on('connect', callback);
    }
    
    /**
     * Register a callback for disconnection events
     * @param {Function} callback - Callback function
     */
    onDisconnect(callback) {
        this.on('disconnect', callback);
    }
    
    /**
     * Register a callback for error events
     * @param {Function} callback - Callback function
     */
    onError(callback) {
        this.on('error', callback);
    }
    
    /**
     * Check if connected to server
     * @returns {boolean} - True if connected
     */
    isConnected() {
        return this.connected;
    }
    
    /**
     * Get current latency in milliseconds
     * @returns {number} - Latency in ms
     */
    getLatency() {
        return this.latency;
    }
    
    /**
     * Enable or disable debug mode
     * @param {boolean} enabled - Whether debug mode is enabled
     * @param {Object} options - Debug options
     */
    setDebugMode(enabled, options = {}) {
        if (typeof enabled === 'boolean') {
            this.debug.logMessages = enabled;
        }
        
        // Update any provided options
        Object.assign(this.debug, options);
    }
}