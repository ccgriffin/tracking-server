const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');

// Rate limiting configuration
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});

// Auth endpoints rate limiting
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // limit each IP to 5 failed login attempts per hour
    message: 'Too many login attempts from this IP, please try again later.'
});

const securityMiddleware = (app) => {
    // Set security HTTP headers
    app.use(helmet());

    // Enable CORS
    app.use(cors({
        origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true
    }));

    // Enable gzip compression
    app.use(compression());

    // Apply rate limiting to all routes
    app.use('/api/', limiter);

    // Apply stricter rate limiting to auth routes
    app.use('/api/auth/', authLimiter);

    // Disable x-powered-by header
    app.disable('x-powered-by');
};

module.exports = {
    securityMiddleware,
    authLimiter
};
