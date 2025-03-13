/**
 * Shared constants for Urban Tank Warfare
 */

export const Constants = {
    // Tank properties
    TANK_SPEED: 5,
    TANK_ROTATION_SPEED: 2.0,
    TANK_HEALTH: 100,
    TANK_ID: 'player',
    
    // Weapons
    CANNON_DAMAGE: 30,
    CANNON_RELOAD_TIME: 1000, // milliseconds
    CANNON_PROJECTILE_SPEED: 50,
    CANNON_PROJECTILE_LIFETIME: 3000, // milliseconds
    
    // Game settings
    GRAVITY: 9.8,
    DEFAULT_FRICTION: 0.95,
    
    // Network settings (for future use)
    NETWORK_UPDATE_RATE: 10, // updates per second
    
    // Game states
    GAME_STATE: {
        LOADING: 'loading',
        MENU: 'menu',
        PLAYING: 'playing',
        PAUSED: 'paused',
        GAME_OVER: 'gameOver'
    },
    
    // Entity types
    ENTITY_TYPE: {
        TANK: 'tank',
        BUILDING: 'building',
        PROJECTILE: 'projectile',
        POWERUP: 'powerup'
    }
};