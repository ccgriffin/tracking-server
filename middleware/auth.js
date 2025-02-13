const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { logger } = require('./logger');

/**
 * Authentication Middleware
 * @module middleware/auth
 */

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
const SESSION_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Promise<Object>} Decoded token payload
 */
const verifyToken = (token) => {
    return new Promise((resolve, reject) => {
        jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) reject(err);
            resolve(decoded);
        });
    });
};

/**
 * Generate JWT token
 * @param {Object} payload - Token payload
 * @returns {string} JWT token
 */
const generateToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
};

/**
 * Authentication middleware
 * Supports both session and JWT authentication
 */
const isAuthenticated = async (req, res, next) => {
    try {
        // Check for JWT authentication first
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            try {
                const decoded = await verifyToken(token);
                const user = await User.findById(decoded.userId);
                if (!user) {
                    logger.warn(`JWT auth failed: User ${decoded.userId} not found`);
                    return res.status(401).json({ message: 'Authentication failed' });
                }
                req.user = user;
                return next();
            } catch (err) {
                logger.warn(`JWT verification failed: ${err.message}`);
            }
        }

        // Fallback to session authentication
        if (!req.session.userId) {
            logger.warn('Session auth failed: No session found');
            return res.status(401).json({ message: 'Authentication required' });
        }

        // Check session expiry
        const sessionAge = Date.now() - req.session.createdAt;
        if (sessionAge > SESSION_EXPIRY) {
            logger.warn(`Session expired for user ${req.session.userId}`);
            req.session.destroy();
            return res.status(401).json({ message: 'Session expired' });
        }

        const user = await User.findById(req.session.userId);
        if (!user) {
            logger.warn(`Session auth failed: User ${req.session.userId} not found`);
            req.session.destroy();
            return res.status(401).json({ message: 'Authentication failed' });
        }

        // Check if account is locked
        if (user.isLocked()) {
            logger.warn(`Access denied: Account ${user._id} is locked`);
            return res.status(401).json({ message: 'Account is locked due to too many failed attempts' });
        }

        // Check if account is active
        if (user.status !== 'active') {
            logger.warn(`Access denied: Account ${user._id} is ${user.status}`);
            return res.status(401).json({ message: `Account is ${user.status}` });
        }

        // Extend session on activity
        req.session.createdAt = Date.now();
        req.user = user;
        next();
    } catch (error) {
        logger.error('Authentication error:', error);
        next(error);
    }
};

module.exports = {
    isAuthenticated,
    generateToken,
    verifyToken
};
