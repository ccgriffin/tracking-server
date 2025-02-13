const express = require('express');
const TrackerData = require('../models/TrackerData');
const router = express.Router();

/**
 * Tracker Routes
 * @module routes/tracker
 */

/**
 * @typedef {Object} LastLocationResponse
 * @property {string} ident - Tracker identifier
 * @property {Object|null} lastLocation - Last known location data
 * @property {number} lastLocation.latitude - Geographic latitude
 * @property {number} lastLocation.longitude - Geographic longitude
 * @property {Date} lastLocation.timestamp - Time of location recording
 * @property {string} lastLocation.deviceName - Name of the tracking device
 * @property {number} lastLocation.speed - Current speed
 * @property {boolean} lastLocation.ignition - Engine ignition status
 * @property {number} lastLocation.batteryLevel - Current battery level
 */

/**
 * Get last known locations for all trackers
 * @route GET /api/tracker/last-known-location
 * @returns {LastLocationResponse[]} 200 - Array of last known locations for all trackers
 * @throws {Error} 500 - Server error
 */
router.get('/last-known-location', async (req, res, next) => {
    try {
        const uniqueTrackers = await TrackerData.distinct('ident');
        console.log('Found trackers:', uniqueTrackers);

        const lastLocations = await Promise.all(uniqueTrackers.map(async (ident) => {
            const lastLocation = await TrackerData.findOne({ ident })
                .sort({ timestamp: -1 })
                .lean();
            
            return {
                ident,
                lastLocation: lastLocation ? {
                    latitude: lastLocation.position.latitude,
                    longitude: lastLocation.position.longitude,
                    timestamp: lastLocation.timestamp,
                    deviceName: lastLocation.device?.name || ident,
                    speed: lastLocation.position.speed,
                    ignition: lastLocation.engine?.ignition?.status,
                    batteryLevel: lastLocation.battery?.level,
                    externalVoltage: lastLocation['external.powersource.voltage']
                } : null
            };
        }));

        res.json(lastLocations);
    } catch (error) {
        console.error('Error in last-known-location:', error);
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
 * @property {boolean} ignition - Engine ignition status
 * @property {number} batteryLevel - Battery level
 */

/**
 * @typedef {Object} GroupedHistoricalData
 * @property {string} date - ISO date string
 * @property {HistoricalDataPoint[]} data - Array of tracking data for the date
 */

/**
 * Get historical tracking data grouped by date
 * @route GET /api/tracker/history
 * @returns {Object.<string, HistoricalDataPoint[]>} 200 - Historical data grouped by date
 * @throws {Error} 500 - Server error
 */
router.get('/history', async (req, res, next) => {
    try {
        const { start, end, page = 1, limit = 1000, interval = 'raw' } = req.query;
        
        // Validate date parameters
        if (!start || !end) {
            return res.status(400).json({ message: 'Start and end dates are required' });
        }

        // Create date range filter
        const startDate = new Date(start);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(end);
        endDate.setHours(23, 59, 59, 999);

        // Calculate skip value for pagination
        const skip = (page - 1) * limit;

        let pipeline = [];
        
        // Match date range
        pipeline.push({
            $match: {
                timestamp: {
                    $gte: startDate,
                    $lte: endDate
                }
            }
        });

        // Data aggregation based on interval
        if (interval !== 'raw') {
            let groupInterval;
            switch(interval) {
                case 'minute':
                    groupInterval = {
                        year: { $year: "$timestamp" },
                        month: { $month: "$timestamp" },
                        day: { $dayOfMonth: "$timestamp" },
                        hour: { $hour: "$timestamp" },
                        minute: { $minute: "$timestamp" }
                    };
                    break;
                case 'hour':
                    groupInterval = {
                        year: { $year: "$timestamp" },
                        month: { $month: "$timestamp" },
                        day: { $dayOfMonth: "$timestamp" },
                        hour: { $hour: "$timestamp" }
                    };
                    break;
                case 'day':
                    groupInterval = {
                        year: { $year: "$timestamp" },
                        month: { $month: "$timestamp" },
                        day: { $dayOfMonth: "$timestamp" }
                    };
                    break;
            }

            pipeline.push({
                $group: {
                    _id: {
                        ident: "$ident",
                        ...groupInterval
                    },
                    deviceName: { $first: "$device.name" },
                    latitude: { $avg: "$position.latitude" },
                    longitude: { $avg: "$position.longitude" },
                    speed: { $avg: "$position.speed" },
                    timestamp: { $first: "$timestamp" },
                    ignition: { $last: "$engine.ignition.status" },
                    batteryLevel: { $avg: "$battery.level" },
                    externalVoltage: { $avg: "$external.powersource.voltage" },
                    dataPoints: { $sum: 1 }
                }
            });
        }

        // Sort by timestamp
        pipeline.push({ $sort: { "timestamp": 1 } });

        // Get total count for pagination
        const totalCount = await TrackerData.aggregate([
            { $match: { timestamp: { $gte: startDate, $lte: endDate } } },
            { $count: "total" }
        ]);

        // Add pagination
        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: parseInt(limit) });

        // Execute aggregation
        const historicalData = await TrackerData.aggregate(pipeline);

        // Format response
        const groupedData = {};
        historicalData.forEach(data => {
            const date = new Date(data.timestamp).toISOString().split('T')[0];
            if (!groupedData[date]) {
                groupedData[date] = [];
            }

            const formattedData = interval === 'raw' ? {
                ident: data.ident,
                deviceName: data.device?.name || data.ident,
                position: {
                    latitude: data.position.latitude,
                    longitude: data.position.longitude,
                    speed: data.position.speed
                },
                timestamp: data.timestamp,
                ignition: data.engine?.ignition?.status,
                batteryLevel: data.battery?.level,
                externalVoltage: data['external.powersource.voltage']
            } : {
                ident: data._id.ident,
                deviceName: data.deviceName || data._id.ident,
                position: {
                    latitude: data.latitude,
                    longitude: data.longitude,
                    speed: data.speed
                },
                timestamp: data.timestamp,
                ignition: data.ignition,
                batteryLevel: data.batteryLevel,
                externalVoltage: data.externalVoltage,
                dataPoints: data.dataPoints
            };

            groupedData[date].push(formattedData);
        });

        // Send response with pagination metadata
        res.json({
            data: groupedData,
            pagination: {
                total: totalCount[0]?.total || 0,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil((totalCount[0]?.total || 0) / limit)
            },
            interval
        });
    } catch (error) {
        console.error('Error in history:', error);
        next(error);
    }
});

/**
 * @typedef {Object} TrackerDataRequest
 * @property {number} server.timestamp - Server-side timestamp
 * @property {number} timestamp - Unix timestamp of the data
 * @property {string} ident - Tracker identifier
 * @property {Object} position - Position information
 * @property {number} position.latitude - Geographic latitude
 * @property {number} position.longitude - Geographic longitude
 * @property {number} [position.speed] - Current speed
 * @property {Object} [battery] - Battery information
 * @property {number} [battery.level] - Battery level
 * @property {Object} [engine] - Engine information
 * @property {Object} [engine.ignition] - Ignition information
 * @property {boolean} [engine.ignition.status] - Ignition status
 */

/**
 * Receive and store tracker data
 * @route POST /api/tracker/data
 * @param {TrackerDataRequest} req.body - Tracker data to store
 * @returns {Object} 201 - Success response
 * @throws {Error} 500 - Server error
 */
router.post('/data', async (req, res, next) => {
    try {
        console.log('Received tracker data:', req.body);
        // Convert Unix timestamps to proper format
        const data = {
            ...req.body,
            'server.timestamp': req.body['server.timestamp'],
            timestamp: new Date(req.body.timestamp * 1000)
        };
        const trackerData = new TrackerData(data);
        await trackerData.save();
        res.status(201).json({ message: 'Data received successfully' });
    } catch (error) {
        console.error('Error saving tracker data:', error);
        next(error);
    }
});

module.exports = router;
