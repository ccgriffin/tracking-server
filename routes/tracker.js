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
 * Receive data from Flespi
 * @route POST /api/tracker/data
 * @param {Object} req.body - Tracker data from Flespi
 * @returns {Object} 200 - Success response
 * @throws {Error} 500 - Server error
 */
router.post('/data', async (req, res, next) => {
    try {
        const dataPoints = Array.isArray(req.body) ? req.body : [req.body];
        
        for (const data of dataPoints) {
            // Validate required fields
            if (!data.ident) {
                logger.warn('Missing identifier in data point:', data);
                continue;
            }

            // Use current time if timestamp is missing
            if (!data.timestamp) {
                data.timestamp = Math.floor(Date.now() / 1000);
                logger.info(`Using current time for tracker ${data.ident}`);
            }

            try {
                // Check if data point already exists
                const existingData = await TrackerData.findOne({
                    ident: data.ident,
                    timestamp: data.timestamp
                });

                if (existingData) {
                    logger.info(`Skipping duplicate data point for tracker ${data.ident} at ${new Date(data.timestamp * 1000).toLocaleString()}`);
                    continue;
                }

                // Store raw data exactly as received
                const trackerData = new TrackerData(data);
                await trackerData.save();
            } catch (error) {
                logger.error(`Error saving data point for tracker ${data.ident}:`, error);
                continue;
            }

            // Detailed console output for tracker message
            console.log('\n=== Tracker Message Received ===');
            console.log(`Identifier: ${data.ident}`);
            const timestamp = new Date(data.timestamp * 1000);
            console.log(`Timestamp: ${timestamp.toLocaleString('en-GB', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            })}`);
            if (data['position.latitude'] && data['position.longitude']) {
                console.log(`Location: ${data['position.latitude']}, ${data['position.longitude']}`);
            }
            console.log(`Speed: ${data['position.speed'] || 0} km/h`);
            console.log(`Battery: ${data['battery.level'] || 'N/A'}%`);
            console.log(`Engine Status: ${data['engine.ignition.status'] ? 'ON' : 'OFF'}`);
            console.log('============================\n');
            
            logger.info(`Received data from tracker: ${data.ident}`);
        }
        res.status(200).json({ message: 'Data received successfully' });
    } catch (error) {
        logger.error('Error saving tracker data:', error);
        next(error);
    }
});

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
        const identifier = req.body.identifier;
        
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
                .lean();

            return {
                identifier,
                lastLocation: lastLocation ? lastLocation : null
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

        if (start) query.timestamp.$gte = Math.floor(new Date(start).getTime() / 1000);
        if (end) query.timestamp.$lte = Math.floor(new Date(end).getTime() / 1000);

        const history = await TrackerData.find(query)
            .sort({ timestamp: 1 })
            .select('-_id ident timestamp position.latitude position.longitude position.speed battery.level engine.ignition.status device.name')
            .lean();

        res.json({ history });
    } catch (error) {
        logger.error('Error fetching tracker history:', error);
        next(error);
    }
});

module.exports = router;
