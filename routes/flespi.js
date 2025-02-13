const express = require('express');
const TrackerData = require('../models/TrackerData');
const { logger } = require('../middleware/logger');

const router = express.Router();

/**
 * Receive data from Flespi
 * @route POST /api/flespi/data
 * @param {Object} req.body - Tracker data from Flespi
 * @returns {Object} 200 - Success response
 * @throws {Error} 500 - Server error
 */
router.post('/data', async (req, res, next) => {
    try {
        const data = req.body;
        
        // Validate required fields
        if (!data.ident || !data.timestamp || !data.position) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Create new tracker data record
        const trackerData = new TrackerData({
            ident: data.ident,
            timestamp: new Date(data.timestamp * 1000), // Convert Unix timestamp to Date
            position: {
                latitude: data.position.latitude,
                longitude: data.position.longitude,
                speed: data.position.speed
            },
            battery: data.battery,
            engine: data.engine,
            device: data.device
        });

        await trackerData.save();
        logger.info(`Received data from tracker: ${data.ident}`);
        res.status(200).json({ message: 'Data received successfully' });
    } catch (error) {
        logger.error('Error saving tracker data:', error);
        next(error);
    }
});

module.exports = router;
