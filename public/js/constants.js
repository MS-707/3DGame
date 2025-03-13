/**
 * Game constants for Urban Tank Warfare
 */

// Shared game constants
export const Constants = {
    // Player constants
    TANK_ID: 'player',
    
    // Physics constants
    GAME_PHYSICS: {
        GRAVITY: -9.81,
        FRICTION: 0.95,
        TANK_SPEED: 5,
        TANK_ROTATION_SPEED: 2.0,
        TANK_ACCELERATION: 0.2,
        TANK_DECELERATION: 0.1,
        TURRET_ROTATION_SPEED: 0.05,
        BULLET_SPEED: 20,
        BULLET_LIFETIME: 3000 // milliseconds
    },
    
    // Gameplay constants
    GAMEPLAY: {
        TANK_HEALTH: 100,
        BULLET_DAMAGE: 20,
        RELOAD_TIME: 1000, // milliseconds
        POWERUP_DURATION: 10000, // milliseconds
        MAX_PLAYERS: 8
    },
    
    // Entity types
    ENTITY_TYPES: {
        TANK: 'TANK',
        BULLET: 'BULLET',
        BUILDING: 'BUILDING',
        POWERUP: 'POWERUP'
    },
    
    // Camera settings
    CAMERA_SETTINGS: {
        FOLLOW_HEIGHT: 10,
        FOLLOW_DISTANCE: 20,
        DAMPING: 0.1,
        LOOK_AHEAD: 5
    }
};

// Network message types for multiplayer
export const NETWORK_MESSAGE_TYPES = {
    PLAYER_JOINED: 'PLAYER_JOINED',
    PLAYER_LEFT: 'PLAYER_LEFT',
    PLAYER_MOVED: 'PLAYER_MOVED',
    PLAYER_SHOT: 'PLAYER_SHOT',
    PLAYER_HIT: 'PLAYER_HIT',
    PLAYER_RESPAWN: 'PLAYER_RESPAWN',
    GAME_STATE: 'GAME_STATE',
    GAME_START: 'GAME_START',
    GAME_END: 'GAME_END',
    ENTITY_UPDATE: 'ENTITY_UPDATE',
    ENTITY_DESTROYED: 'ENTITY_DESTROYED',
    CHAT_MESSAGE: 'CHAT_MESSAGE',
    ERROR: 'ERROR'
};