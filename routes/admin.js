const express = require('express');
const User = require('../models/User');
const TrackerData = require('../models/TrackerData');
const { logger } = require('../middleware/logger');

const router = express.Router();

/**
 * Admin middleware to check if user is admin
 */
const isAdmin = async (req, res, next) => {
    if (req.user.role !== 'admin') {
        logger.warn(`Non-admin user ${req.user.username} attempted to access admin route`);
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
};

/**
 * Get all users with their trackers
 * @route GET /api/admin/users
 */
router.get('/users', isAdmin, async (req, res, next) => {
    try {
        const users = await User.find({})
            .select('username email role status lastLogin trackers')
            .lean();

        res.json({ users });
    } catch (error) {
        logger.error('Error fetching users:', error);
        next(error);
    }
});

/**
 * Get all trackers and their assigned users
 * @route GET /api/admin/trackers
 */
router.get('/trackers', isAdmin, async (req, res, next) => {
    try {
        // Get all unique tracker identifiers
        const uniqueTrackers = await TrackerData.distinct('ident');

        // Get all data for each tracker
        const trackers = await Promise.all(uniqueTrackers.map(async (ident) => {
            // Get last location
            const lastLocation = await TrackerData.findOne({ ident })
                .sort({ timestamp: -1 })
                .lean();

            // Get all locations in last 24 hours
            const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const recentLocations = await TrackerData.find({
                ident,
                timestamp: { $gte: Math.floor(last24Hours.getTime() / 1000) }
            }).sort({ timestamp: -1 }).lean();

            // Calculate stats
            const totalDataPoints = await TrackerData.countDocuments({ ident });
            const firstDataPoint = await TrackerData.findOne({ ident })
                .sort({ timestamp: 1 })
                .lean();
            
            // Calculate activity stats
            const activePoints = recentLocations.filter(loc => 
                loc['position.speed'] && loc['position.speed'] > 0
            ).length;
            const activityPercentage = recentLocations.length > 0 
                ? (activePoints / recentLocations.length * 100).toFixed(1)
                : 0;

            // Find users who have this tracker
            const assignedUsers = await User.find({ trackers: ident })
                .select('username email')
                .lean();

            return {
                identifier: ident,
                lastLocation: lastLocation ? {
                    ...lastLocation,
                    formattedTime: new Date(lastLocation.timestamp * 1000).toLocaleString()
                } : null,
                stats: {
                    totalDataPoints,
                    firstDataPoint: firstDataPoint ? {
                        timestamp: firstDataPoint.timestamp,
                        formattedTime: new Date(firstDataPoint.timestamp * 1000).toLocaleString()
                    } : null,
                    last24Hours: {
                        dataPoints: recentLocations.length,
                        activePoints,
                        activityPercentage
                    }
                },
                recentLocations: recentLocations.slice(0, 10).map(loc => ({
                    ...loc,
                    formattedTime: new Date(loc.timestamp * 1000).toLocaleString()
                })),
                assignedUsers,
                debug: {
                    lastRawData: lastLocation
                }
            };
        }));

        res.json({ trackers });
    } catch (error) {
        logger.error('Error fetching trackers:', error);
        next(error);
    }
});

/**
 * Get tracker assignment stats
 * @route GET /api/admin/stats
 */
router.get('/stats', isAdmin, async (req, res, next) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalTrackers = await TrackerData.distinct('ident').then(arr => arr.length);
        const unassignedTrackers = await TrackerData.distinct('ident').then(async trackers => {
            const assigned = await User.distinct('trackers');
            return trackers.filter(t => !assigned.includes(t)).length;
        });
        const activeUsers = await User.countDocuments({ status: 'active' });

        // Get system stats
        const dbStats = {
            users: await User.collection.stats(),
            trackerData: await TrackerData.collection.stats()
        };

        // Get data volume stats
        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const dataStats = {
            total: await TrackerData.countDocuments(),
            last24Hours: await TrackerData.countDocuments({
                timestamp: { $gte: Math.floor(last24Hours.getTime() / 1000) }
            }),
            byTracker: await TrackerData.aggregate([
                { $group: { _id: '$ident', count: { $sum: 1 } } }
            ]).exec()
        };

        // Get active trackers (sent data in last 24h)
        const activeTrackers = await TrackerData.distinct('ident', {
            timestamp: { $gte: Math.floor(last24Hours.getTime() / 1000) }
        });

        res.json({
            stats: {
                users: {
                    total: totalUsers,
                    active: activeUsers
                },
                trackers: {
                    total: totalTrackers,
                    unassigned: unassignedTrackers,
                    active: activeTrackers.length,
                    inactive: totalTrackers - activeTrackers.length
                },
                data: {
                    points: dataStats,
                    volumeStats: {
                        totalSizeBytes: dbStats.trackerData.size,
                        avgObjectSizeBytes: dbStats.trackerData.avgObjSize,
                        storageUsedBytes: dbStats.trackerData.storageSize
                    }
                },
                debug: {
                    dbStats,
                    activeTrackerIds: activeTrackers
                }
            }
        });
    } catch (error) {
        logger.error('Error fetching stats:', error);
        next(error);
    }
});

/**
 * Update user status
 * @route PATCH /api/admin/users/:userId/status
 */
router.patch('/users/:userId/status', isAdmin, async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { status } = req.body;

        if (!['active', 'inactive', 'suspended'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { status },
            { new: true }
        ).select('username email role status');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        logger.info(`Admin ${req.user.username} updated status for user ${user.username} to ${status}`);
        res.json({ user });
    } catch (error) {
        logger.error('Error updating user status:', error);
        next(error);
    }
});

/**
 * Delete user
 * @route DELETE /api/admin/users/:userId
 */
router.delete('/users/:userId', isAdmin, async (req, res, next) => {
    try {
        const { userId } = req.params;
        const user = await User.findByIdAndDelete(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        logger.info(`Admin ${req.user.username} deleted user ${user.username}`);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        logger.error('Error deleting user:', error);
        next(error);
    }
});

/**
 * Assign tracker to user
 * @route POST /api/admin/assign-tracker
 */
router.post('/assign-tracker', isAdmin, async (req, res, next) => {
    try {
        const { userId, trackerId } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if tracker exists
        const trackerExists = await TrackerData.findOne({ ident: trackerId });
        if (!trackerExists) {
            return res.status(404).json({ message: 'Tracker not found' });
        }

        // Check if tracker is already assigned to user
        if (user.trackers.includes(trackerId)) {
            return res.status(400).json({ message: 'Tracker already assigned to user' });
        }

        user.trackers.push(trackerId);
        await user.save();

        logger.info(`Admin ${req.user.username} assigned tracker ${trackerId} to user ${user.username}`);
        res.json({ message: 'Tracker assigned successfully', user });
    } catch (error) {
        logger.error('Error assigning tracker:', error);
        next(error);
    }
});

/**
 * Unassign tracker from user
 * @route POST /api/admin/unassign-tracker
 */
router.post('/unassign-tracker', isAdmin, async (req, res, next) => {
    try {
        const { userId, trackerId } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const trackerIndex = user.trackers.indexOf(trackerId);
        if (trackerIndex === -1) {
            return res.status(400).json({ message: 'Tracker not assigned to user' });
        }

        user.trackers.splice(trackerIndex, 1);
        await user.save();

        logger.info(`Admin ${req.user.username} unassigned tracker ${trackerId} from user ${user.username}`);
        res.json({ message: 'Tracker unassigned successfully', user });
    } catch (error) {
        logger.error('Error unassigning tracker:', error);
        next(error);
    }
});

/**
 * Get detailed debug information for a tracker
 * @route GET /api/admin/trackers/:identifier/debug
 */
router.get('/trackers/:identifier/debug', isAdmin, async (req, res, next) => {
    try {
        const { identifier } = req.params;

        // Get all data points for this tracker
        const allData = await TrackerData.find({ ident: identifier })
            .sort({ timestamp: -1 })
            .lean();

        if (allData.length === 0) {
            return res.status(404).json({ message: 'No data found for tracker' });
        }

        // Calculate time gaps between data points
        const timeGaps = [];
        for (let i = 1; i < allData.length; i++) {
            const gap = allData[i-1].timestamp - allData[i].timestamp;
            timeGaps.push({
                start: new Date(allData[i].timestamp * 1000).toLocaleString(),
                end: new Date(allData[i-1].timestamp * 1000).toLocaleString(),
                gapSeconds: gap
            });
        }

        // Find largest gaps
        const sortedGaps = [...timeGaps].sort((a, b) => b.gapSeconds - a.gapSeconds);
        const largestGaps = sortedGaps.slice(0, 5);

        // Calculate speed statistics
        const speeds = allData.map(d => d['position.speed'] || 0);
        const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
        const maxSpeed = Math.max(...speeds);

        // Calculate battery drain
        const batteryLevels = allData
            .filter(d => d['battery.level'] != null)
            .map(d => ({
                level: d['battery.level'],
                timestamp: d.timestamp
            }));
        const batteryDrain = [];
        for (let i = 1; i < batteryLevels.length; i++) {
            const drain = batteryLevels[i-1].level - batteryLevels[i].level;
            if (drain > 0) {
                const timeSpan = batteryLevels[i-1].timestamp - batteryLevels[i].timestamp;
                batteryDrain.push({
                    start: new Date(batteryLevels[i].timestamp * 1000).toLocaleString(),
                    end: new Date(batteryLevels[i-1].timestamp * 1000).toLocaleString(),
                    drain,
                    drainPerHour: (drain / timeSpan) * 3600
                });
            }
        }

        // Get assigned users
        const assignedUsers = await User.find({ trackers: identifier })
            .select('username email lastLogin')
            .lean();

        res.json({
            identifier,
            summary: {
                totalDataPoints: allData.length,
                firstDataPoint: {
                    timestamp: allData[allData.length - 1].timestamp,
                    formattedTime: new Date(allData[allData.length - 1].timestamp * 1000).toLocaleString()
                },
                lastDataPoint: {
                    timestamp: allData[0].timestamp,
                    formattedTime: new Date(allData[0].timestamp * 1000).toLocaleString()
                },
                averageTimeBetweenPoints: timeGaps.reduce((a, b) => a + b.gapSeconds, 0) / timeGaps.length
            },
            timeGaps: {
                largest: largestGaps,
                histogram: timeGaps.reduce((acc, gap) => {
                    const bucket = Math.floor(gap.gapSeconds / 60); // Group by minutes
                    acc[bucket] = (acc[bucket] || 0) + 1;
                    return acc;
                }, {})
            },
            movement: {
                averageSpeed: avgSpeed,
                maxSpeed,
                speedHistogram: speeds.reduce((acc, speed) => {
                    const bucket = Math.floor(speed / 5) * 5; // Group by 5 km/h
                    acc[bucket] = (acc[bucket] || 0) + 1;
                    return acc;
                }, {})
            },
            battery: {
                levels: batteryLevels.slice(0, 100), // Last 100 readings
                drain: {
                    records: batteryDrain,
                    averagePerHour: batteryDrain.reduce((a, b) => a + b.drainPerHour, 0) / batteryDrain.length
                }
            },
            access: {
                assignedUsers,
                lastAccessed: await TrackerData.findOne({ ident: identifier })
                    .sort({ 'metadata.accessedAt': -1 })
                    .select('metadata.accessedAt metadata.accessedBy')
                    .lean()
            },
            rawData: {
                latest: allData[0],
                sample: allData.filter((_, i) => i % Math.floor(allData.length / 10) === 0) // 10 evenly spaced samples
            }
        });
    } catch (error) {
        logger.error('Error fetching tracker debug info:', error);
        next(error);
    }
});

module.exports = router;
