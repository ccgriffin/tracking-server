const express = require('express');
const TrackerData = require('../models/TrackerData');
const { logger } = require('../middleware/logger');

const router = express.Router();

/**
 * Parse raw HTTP request data from Flespi
 * @param {string} rawData - Raw HTTP request data
 * @returns {Array} Parsed JSON array from request body
 */
function parseRawData(rawData) {
    try {
        // Find the start of JSON data (after headers)
        const jsonStart = rawData.indexOf('[');
        if (jsonStart === -1) return null;
        
        // Extract and parse JSON data
        const jsonData = rawData.substring(jsonStart);
        return JSON.parse(jsonData);
    } catch (error) {
        logger.error('Error parsing raw data:', error);
        return null;
    }
}

/**
 * Receive data from Flespi
 * @route POST /api/flespi/data
 * @param {Object} req.body - Tracker data from Flespi
 * @returns {Object} 200 - Success response
 * @throws {Error} 500 - Server error
 */
router.post('/data', async (req, res, next) => {
    try {
        // Handle raw data format from Flespi
        let trackerDataArray;
        if (req.body.data && typeof req.body.data === 'string') {
            trackerDataArray = parseRawData(req.body.data);
            if (!trackerDataArray) {
                return res.status(400).json({ message: 'Invalid data format' });
            }
        } else if (Array.isArray(req.body)) {
            trackerDataArray = req.body;
        } else {
            trackerDataArray = [req.body];
        }

        const savedData = [];
        for (const data of trackerDataArray) {
            // Validate required fields
            if (!data.ident || !data.timestamp || !data.position) {
                logger.warn(`Missing required fields in data: ${JSON.stringify(data)}`);
                continue;
            }

            // Create new tracker data record
            const trackerData = new TrackerData({
                ident: data.ident,
                timestamp: new Date(data.timestamp * 1000), // Convert Unix timestamp to Date
                position: {
                    latitude: data.position.latitude,
                    longitude: data.position.longitude,
                    speed: data.position.speed,
                    altitude: data.position.altitude,
                    direction: data.position.direction,
                    satellites: data.position.satellites
                },
                battery: {
                    level: data.battery?.level,
                    voltage: data.battery?.voltage
                },
                engine: {
                    ignition: {
                        status: data.engine?.ignition?.status
                    }
                },
                device: {
                    id: data.device?.id,
                    name: data.device?.name,
                    type: {
                        id: data.device?.type?.id
                    }
                },
                external: {
                    powersource: {
                        voltage: data.external?.powersource?.voltage
                    }
                }
            });

            await trackerData.save();
            savedData.push(trackerData);
            logger.info(`Received data from tracker: ${data.ident}`);
        }

        res.status(200).json({ 
            message: 'Data received successfully',
            count: savedData.length
        });
    } catch (error) {
        logger.error('Error saving tracker data:', error);
        next(error);
    }
});

module.exports = router;
