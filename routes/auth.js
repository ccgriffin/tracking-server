const express = require('express');
const isAuthenticated = require('../middleware/auth');
const User = require('../models/User');
const TrackerData = require('../models/TrackerData');
const { logger } = require('../middleware/logger');

const router = express.Router();

/**
 * Authentication Routes
 * @module routes/auth
 */

/**
 * @typedef {Object} RegisterRequest
 * @property {string} username - User's username
 * @property {string} email - User's email
 * @property {string} password - User's password
 */

/**
 * Register endpoint - Creates a new user account
 * @route POST /api/auth/register
 * @param {RegisterRequest} req.body - Registration details
 * @returns {Object} 201 - Success response with user created
 * @returns {Object} 400 - Validation error
 * @returns {Object} 409 - Username/email already exists
 * @throws {Error} 500 - Server error
 */
router.post('/register', async (req, res, next) => {
    try {
        const { username, email, password } = req.body;

        // Check if username or email already exists
        const existingUser = await User.findOne({
            $or: [{ username }, { email }]
        });

        if (existingUser) {
            return res.status(409).json({
                message: existingUser.username === username ? 
                    'Username already exists' : 
                    'Email already registered'
            });
        }

        // Create new user
        const user = new User({
            username,
            email,
            password,
            trackers: []
        });

        await user.save();
        logger.info(`New user registered: ${username}`);

        res.status(201).json({
            message: 'Registration successful'
        });
    } catch (error) {
        logger.error('Registration error:', error);
        next(error);
    }
});

/**
 * @typedef {Object} LoginRequest
 * @property {string} username - User's username
 * @property {string} password - User's password
 */

/**
 * @typedef {Object} LoginResponse
 * @property {string} message - Response message indicating login status
 */

/**
 * Login endpoint - Authenticates user credentials and creates a session
 * @route POST /api/auth/login
 * @param {LoginRequest} req.body - Login credentials
 * @returns {LoginResponse} 200 - Success response with session created
 * @returns {Object} 401 - Invalid credentials error
 * @throws {Error} 500 - Server error
 */
router.post('/login', async (req, res, next) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        
        if (!user) {
            logger.warn(`Login failed: User ${username} not found`);
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        // Check if account is locked
        if (user.isLocked()) {
            logger.warn(`Login attempt on locked account: ${username}`);
            return res.status(401).json({ 
                message: 'Account is locked due to too many failed attempts. Please try again later.' 
            });
        }

        // Verify password
        const isValid = await user.comparePassword(password);
        
        if (!isValid) {
            // Increment failed attempts
            await user.incrementLoginAttempts();
            logger.warn(`Failed login attempt for user: ${username}`);
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        // Reset login attempts on successful login
        await user.resetLoginAttempts();
        await user.updateLastLogin();

        req.session.userId = user._id;
        logger.info(`User logged in: ${username}`);
        res.json({ message: 'Login successful' });
    } catch (error) {
        logger.error('Login error:', error);
        next(error);
    }
});

/**
 * Logout endpoint - Destroys the current session
 * @route POST /api/auth/logout
 * @returns {Object} 200 - Success response with session destroyed
 */
router.post('/logout', (req, res) => {
    const userId = req.session.userId;
    req.session.destroy();
    logger.info(`User logged out: ${userId}`);
    res.json({ message: 'Logout successful' });
});

/**
 * @typedef {Object} LocationData
 * @property {number} latitude - Geographic latitude
 * @property {number} longitude - Geographic longitude
 * @property {Date} timestamp - Time of location recording
 * @property {string} deviceName - Name of the tracking device
 * @property {number} batteryLevel - Current battery level
 * @property {boolean} ignition - Engine ignition status
 * @property {number} speed - Current speed
 */

/**
 * @typedef {Object} TrackerLocation
 * @property {string} ident - Tracker identifier
 * @property {LocationData|null} lastLocation - Last known location data, null if no data available
 */

/**
 * Get last known locations for all trackers
 * @route GET /api/auth/trackers/last-known-location
 * @returns {TrackerLocation[]} 200 - Array of tracker locations with their last known positions
 * @throws {Error} 500 - Server error
 */
router.get('/trackers/last-known-location', async (req, res, next) => {
    try {
        const uniqueTrackers = await TrackerData.distinct('ident');
        logger.debug('Found trackers:', uniqueTrackers);

        const lastLocations = await Promise.all(uniqueTrackers.map(async (ident) => {
            const lastLocation = await TrackerData.findOne({ ident })
                .sort({ timestamp: -1 })
                .select('ident position.latitude position.longitude timestamp device.name battery.level engine.ignition.status position.speed')
                .lean();

            return {
                ident,
                lastLocation: lastLocation ? {
                    latitude: lastLocation.position.latitude,
                    longitude: lastLocation.position.longitude,
                    timestamp: lastLocation.timestamp,
                    deviceName: lastLocation.device?.name || ident,
                    batteryLevel: lastLocation.battery?.level,
                    ignition: lastLocation.engine?.ignition?.status,
                    speed: lastLocation.position.speed
                } : null
            };
        }));

        res.json(lastLocations);
    } catch (error) {
        logger.error('Error fetching last known locations:', error);
        next(error);
    }
});

module.exports = router;
