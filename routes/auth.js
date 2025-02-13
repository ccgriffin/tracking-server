const express = require('express');
const isAuthenticated = require('../middleware/auth');
const User = require('../models/User');
const TrackerData = require('../models/TrackerData');

const router = express.Router();

/**
 * Authentication Routes
 * @module routes/auth
 */

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
        
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        req.session.userId = user._id;
        res.json({ message: 'Login successful' });
    } catch (error) {
        next(error);
    }
});

/**
 * Logout endpoint - Destroys the current session
 * @route POST /api/auth/logout
 * @returns {Object} 200 - Success response with session destroyed
 */
router.post('/logout', (req, res) => {
    req.session.destroy();
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
        console.log('Found trackers:', uniqueTrackers);

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
        next(error);
    }
});

/**
 * @typedef {Object} HistoricalDataPoint
 * @property {string} ident - Tracker identifier
 * @property {string} deviceName - Name of the tracking device
 * @property {Object} position - Position information
 * @property {number} position.latitude - Geographic latitude
 * @property {number} position.longitude - Geographic longitude
 * @property {number} position.speed - Current speed
 * @property {Date} timestamp - Time of data recording
 * @property {number} batteryLevel - Battery level at time of recording
 * @property {boolean} ignition - Engine ignition status
 */

/**
 * @typedef {Object} HistoricalData
 * @property {string} date - ISO date string
 * @property {HistoricalDataPoint[]} data - Array of tracking data points for the date
 */

/**
 * Get historical tracking data grouped by date
 * @route GET /api/auth/trackers/history
 * @returns {Object.<string, HistoricalDataPoint[]>} 200 - Historical tracking data grouped by date
 * @throws {Error} 500 - Server error
 */
router.get('/trackers/history', async (req, res, next) => {
    try {
        const historicalData = await TrackerData.find({})
            .sort({ timestamp: -1 })
            .select('ident position.latitude position.longitude timestamp device.name battery.level engine.ignition.status position.speed')
            .lean();

        const groupedData = {};
        historicalData.forEach(data => {
            const date = new Date(data.timestamp).toISOString().split('T')[0];
            if (!groupedData[date]) {
                groupedData[date] = [];
            }
            groupedData[date].push({
                ident: data.ident,
                deviceName: data.device?.name || data.ident,
                position: {
                    latitude: data.position.latitude,
                    longitude: data.position.longitude,
                    speed: data.position.speed
                },
                timestamp: data.timestamp,
                batteryLevel: data.battery?.level,
                ignition: data.engine?.ignition?.status
            });
        });

        res.json(groupedData);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
