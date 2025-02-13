const User = require('../models/User');

/**
 * Authentication Middleware
 * @module middleware/auth
 */

/**
 * Middleware to verify if a user is authenticated via session
 * 
 * This middleware checks if there is a valid user session and attaches
 * the user object to the request if authenticated. If no valid session
 * exists, it returns a 401 Unauthorized response.
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.session - Session object containing user information
 * @param {string} req.session.userId - ID of the authenticated user
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 * @throws {Error} 401 - If user is not authenticated
 * @throws {Error} 500 - If server error occurs during authentication
 */
const isAuthenticated = async (req, res, next) => {
    try {
        console.log('Session:', req.session); // Debug log for session state

        // Check if user ID exists in session
        if (!req.session.userId) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        // Find user by ID from session
        const user = await User.findById(req.session.userId);
        if (!user) {
            // Clear invalid session and return error
            req.session.destroy();
            return res.status(401).json({ message: 'User not found' });
        }

        // Attach user object to request for use in subsequent middleware/routes
        req.user = user;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        next(error);
    }
};

module.exports = isAuthenticated;
