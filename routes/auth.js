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

router.post('/register', async (req, res, next) => {
    try {
        const { username, email, password } = req.body;

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

        const user = new User({
            username,
            email,
            password,
            trackers: []
        });

        await user.save();
        
        // Detailed console output for new registration
        console.log('\n=== New User Registration ===');
        console.log(`Username: ${username}`);
        console.log(`Email: ${email}`);
        console.log(`Time: ${new Date().toLocaleString()}`);
        console.log('============================\n');
        
        logger.info(`New user registered: ${username}`);
        res.status(201).json({ message: 'Registration successful' });
    } catch (error) {
        logger.error('Registration error:', error);
        next(error);
    }
});

router.post('/login', async (req, res, next) => {
    try {
        const { username, email, password } = req.body;
        const user = await User.findOne({
            $or: [{ username }, { email }]
        });
        
        if (!user) {
            // Detailed console output for failed login - user not found
            console.log('\n=== Login Failed - User Not Found ===');
            console.log(`Attempted Username/Email: ${username || email}`);
            console.log(`Time: ${new Date().toLocaleString()}`);
            console.log('==================================\n');
            
            logger.warn(`Login failed: User ${username || email} not found`);
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        if (user.isLocked()) {
            // Detailed console output for locked account attempt
            console.log('\n=== Login Failed - Account Locked ===');
            console.log(`Username: ${username}`);
            console.log(`Time: ${new Date().toLocaleString()}`);
            console.log(`Failed Attempts: ${user.loginAttempts}`);
            console.log(`Lock Expires: ${user.lockUntil ? new Date(user.lockUntil).toLocaleString() : 'N/A'}`);
            console.log('=================================\n');
            
            logger.warn(`Login attempt on locked account: ${username}`);
            return res.status(401).json({ 
                message: 'Account is locked due to too many failed attempts. Please try again later.' 
            });
        }

        const isValid = await user.comparePassword(password);
        
        if (!isValid) {
            await user.incrementLoginAttempts();
            
            // Detailed console output for failed login - invalid password
            console.log('\n=== Login Failed - Invalid Password ===');
            console.log(`Username: ${username}`);
            console.log(`Time: ${new Date().toLocaleString()}`);
            console.log(`Failed Attempts: ${user.loginAttempts + 1}`);
            console.log('====================================\n');
            
            logger.warn(`Failed login attempt for user: ${username}`);
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        await user.resetLoginAttempts();
        await user.updateLastLogin();

        req.session.userId = user._id;
        req.session.createdAt = Date.now();
        
        // Detailed console output for successful login
        console.log('\n=== User Login Successful ===');
        console.log(`Username: ${username}`);
        console.log(`Email: ${user.email}`);
        console.log(`Time: ${new Date().toLocaleString()}`);
        console.log(`Last Login: ${user.lastLogin ? user.lastLogin.toLocaleString() : 'First login'}`);
        console.log(`Device Count: ${user.trackers.length}`);
        console.log('============================\n');
        
        logger.info(`User logged in: ${username}`);
        res.json({ message: 'Login successful' });
    } catch (error) {
        logger.error('Login error:', error);
        next(error);
    }
});

router.post('/logout', async (req, res) => {
    const userId = req.session.userId;
    
    // Get username for logging
    let username = 'Unknown';
    try {
        const user = await User.findById(userId);
        if (user) {
            username = user.username;
        }
    } catch (error) {
        logger.error('Error fetching user for logout:', error);
    }
    
    // Detailed console output for logout
    console.log('\n=== User Logout ===');
    console.log(`Username: ${username}`);
    console.log(`User ID: ${userId}`);
    console.log(`Time: ${new Date().toLocaleString()}`);
    console.log('==================\n');
    
    req.session.destroy();
    logger.info(`User logged out: ${userId}`);
    res.json({ message: 'Logout successful' });
});

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
