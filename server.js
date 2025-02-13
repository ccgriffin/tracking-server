const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const trackerRoutes = require('./routes/tracker');
const authRoutes = require('./routes/auth');

/**
 * Main Server Application
 * @module server
 */

const app = express();

/**
 * Session Configuration
 * Configures express-session middleware for user authentication
 * - Secret key used for signing session ID cookie
 * - Sessions are not saved for unmodified sessions
 * - Sessions are saved even if uninitialized
 * - Cookie security is disabled for non-HTTPS environments
 */
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Environment Variables
const PORT = process.env.PORT || 3000;

/**
 * Middleware Configuration
 * - bodyParser.json() for parsing JSON request bodies
 * - express.static for serving static files from 'public' directory
 */
app.use(bodyParser.json());
app.use(express.static('public'));

/**
 * API Routes Configuration
 * - /api/tracker: Routes for tracker data operations
 * - /api/auth: Routes for authentication operations
 */
app.use('/api/tracker', trackerRoutes);
app.use('/api/auth', authRoutes);

/**
 * Serve login page at root path
 * @route GET /
 * @returns {HTML} Login page
 */
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

/**
 * Serve tracking page
 * @route GET /tracking
 * @returns {HTML} Tracking interface page
 */
app.get('/tracking', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'tracking.html'));
});

/**
 * Global Error Handler
 * Handles various types of errors and sends appropriate responses
 * - Validation errors return 400 with detailed error messages
 * - Other errors return 500 with generic message (detailed in development)
 */
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            message: 'Validation Error',
            errors: Object.values(err.errors).map(e => e.message)
        });
    }

    res.status(500).json({
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

/**
 * Database Connection and Server Initialization
 * Connects to MongoDB and starts the Express server
 * - Uses MongoDB's default port 27017
 * - Implements connection error handling
 * - Logs server endpoints upon successful start
 */
mongoose.connect('mongodb://localhost:27017/trackingserver', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('MongoDB connected successfully');
    
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
        console.log(`Login page available at http://localhost:${PORT}`);
        console.log(`Tracking page available at http://localhost:${PORT}/tracking`);
    });
})
.catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

/**
 * Process Event Handlers
 * Handle various process events for graceful shutdown and error reporting
 */

// Handle graceful shutdown
process.on('SIGINT', () => {
    mongoose.connection.close(() => {
        console.log('MongoDB connection closed through app termination');
        process.exit(0);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    mongoose.connection.close(() => {
        console.log('MongoDB connection closed due to uncaught exception');
        process.exit(1);
    });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    mongoose.connection.close(() => {
        console.log('MongoDB connection closed due to unhandled rejection');
        process.exit(1);
    });
});
