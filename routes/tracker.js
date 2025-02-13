const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const TrackerData = require('../models/TrackerData');
const { logger } = require('../middleware/logger');

const router = express.Router();

/**
 * Tracker Management Routes
 * @module routes/tracker
 */

/**
 * Add a tracker to user's account
 * @route POST /api/tracker/add
 * @param {string} req.body.identifier - Tracker identifier to add
 * @returns {Object} 200 - Success response with updated trackers list
 * @returns {Object} 400 - Invalid request error
 * @throws {Error} 500 - Server error
 */
router.post('/add', auth.isAuthenticated, async (req, res, next) => {
    try {
        const { identifier } = req.body;
        
        if (!identifier) {
            return res.status(400).json({ message: 'Tracker identifier is required' });
        }

        // Check if tracker exists in user's list
        if (req.user.trackers.includes(identifier)) {
            return res.status(400).json({ message: 'Tracker already added to your account' });
        }

        // Add tracker to user's list
        req.user.trackers.push(identifier);
        await req.user.save();

        logger.info(`User ${req.user.username} added tracker: ${identifier}`);
        res.json({ 
            message: 'Tracker added successfully',
            trackers: req.user.trackers
        });
    } catch (error) {
        logger.error('Error adding tracker:', error);
        next(error);
    }
});

/**
 * Remove a tracker from user's account
 * @route DELETE /api/tracker/remove/:identifier
 * @param {string} req.params.identifier - Tracker identifier to remove
 * @returns {Object} 200 - Success response with updated trackers list
 * @returns {Object} 404 - Tracker not found error
 * @throws {Error} 500 - Server error
 */
router.delete('/remove/:identifier', auth.isAuthenticated, async (req, res, next) => {
    try {
        const { identifier } = req.params;
        
        // Check if tracker exists in user's list
        const trackerIndex = req.user.trackers.indexOf(identifier);
        if (trackerIndex === -1) {
            return res.status(404).json({ message: 'Tracker not found in your account' });
        }

        // Remove tracker from user's list
        req.user.trackers.splice(trackerIndex, 1);
        await req.user.save();

        logger.info(`User ${req.user.username} removed tracker: ${identifier}`);
        res.json({ 
            message: 'Tracker removed successfully',
            trackers: req.user.trackers
        });
    } catch (error) {
        logger.error('Error removing tracker:', error);
        next(error);
    }
});

/**
 * List user's trackers
 * @route GET /api/tracker/list
 * @returns {Object} 200 - Success response with user's trackers list
 * @throws {Error} 500 - Server error
 */
router.get('/list', auth.isAuthenticated, async (req, res, next) => {
    try {
        const trackers = await Promise.all(req.user.trackers.map(async (identifier) => {
            const lastLocation = await TrackerData.findOne({ ident: identifier })
                .sort({ timestamp: -1})
                .select('ident position.latitude position.longitude timestamp device.name battery.level engine.ignition.status position.speed')
                .lean();

            return {
                identifier,
                lastLocation: lastLocation ? {
                    latitude: lastLocation.position.latitude,
                    longitude: lastLocation.position.longitude,
                    timestamp: lastLocation.timestamp,
                    deviceName: lastLocation.device?.name || identifier,
                    batteryLevel: lastLocation.battery?.level,
                    ignition: lastLocation.engine?.ignition?.status,
                    speed: lastLocation.position.speed
                } : null
            };
        }));

        res.json({ trackers });
    } catch (error) {
        logger.error('Error listing trackers:', error);
        next(error);
    }
});

/**
 * Get tracker history
 * @route GET /api/tracker/history/:identifier
 * @param {string} req.params.identifier - Tracker identifier
 * @param {string} req.query.start - Start date (ISO format)
 * @param {string} req.query.end - End date (ISO format)
 * @returns {Object} 200 - Success response with tracker history
 * @returns {Object} 404 - Tracker not found error
 * @throws {Error} 500 - Server error
 */
router.get('/history/:identifier', auth.isAuthenticated, async (req, res, next) => {
    try {
        const { identifier } = req.params;
        const { start, end } = req.query;

        // Validate tracker ownership
        if (!req.user.trackers.includes(identifier)) {
            return res.status(404).json({ message: 'Tracker not found in your account' });
        }

        // Build query
        const query = {
            ident: identifier,
            timestamp: {}
        };

        if (start) query.timestamp.$gte = new Date(start);
        if (end) query.timestamp.$lte = new Date(end);

        const history = await TrackerData.find(query)
            .sort({ timestamp: 1 })
            .select('-_id ident position.latitude position.longitude timestamp device.name battery.level engine.ignition.status position.speed')
            .lean();

        res.json({ history });
    } catch (error) {
        logger.error('Error fetching tracker history:', error);
        next(error);
    }
});

module.exports = router;
