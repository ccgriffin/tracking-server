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

        // Get last location for each tracker
        const trackers = await Promise.all(uniqueTrackers.map(async (ident) => {
            const lastLocation = await TrackerData.findOne({ ident })
                .sort({ timestamp: -1 })
                .select('ident position.latitude position.longitude timestamp device.name battery.level engine.ignition.status position.speed')
                .lean();

            // Find users who have this tracker
            const assignedUsers = await User.find({ trackers: ident })
                .select('username email')
                .lean();

            return {
                identifier: ident,
                lastLocation: lastLocation ? {
                    latitude: lastLocation.position.latitude,
                    longitude: lastLocation.position.longitude,
                    timestamp: lastLocation.timestamp,
                    deviceName: lastLocation.device?.name || ident,
                    batteryLevel: lastLocation.battery?.level,
                    ignition: lastLocation.engine?.ignition?.status,
                    speed: lastLocation.position.speed
                } : null,
                assignedUsers
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

        res.json({
            stats: {
                totalUsers,
                totalTrackers,
                unassignedTrackers,
                activeUsers
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

module.exports = router;
