const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const path = require('path');
const { securityMiddleware } = require('./middleware/security');
const { morganMiddleware, requestLogger, errorLogger } = require('./middleware/logger');
const auth = require('./middleware/auth');
const trackerRoutes = require('./routes/tracker');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');

const app = express();

// Apply security middleware
securityMiddleware(app);

// Apply logging middleware
app.use(morganMiddleware);
app.use(requestLogger);

// Session Configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        // Allow non-secure cookies since we're using a reverse proxy
        secure: false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Environment Variables
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/trackingserver';

// Middleware Configuration
app.use(express.json({ limit: '10kb' }));

// Serve static files with explicit MIME types
app.use(express.static('public', {
    setHeaders: (res, path) => {
        if (path.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        }
    }
}));

// Trust first proxy
app.set('trust proxy', 1);

// API Routes Configuration
app.use('/api/tracker', auth.isAuthenticated, trackerRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', auth.isAuthenticated, adminRoutes); // Admin routes require authentication

// Serve static pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/tracking', auth.isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'tracking.html'));
});

app.get('/admin', auth.isAuthenticated, async (req, res) => {
    // Check if user is admin
    if (req.user.role !== 'admin') {
        return res.redirect('/tracking');
    }
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date(),
        uptime: process.uptime()
    });
});

// Global Error Handler
app.use(errorLogger);
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            status: 'error',
            message: 'Validation Error',
            errors: Object.values(err.errors).map(e => e.message)
        });
    }

    if (err.code === 11000) {
        return res.status(400).json({
            status: 'error',
            message: 'Duplicate Key Error',
            field: Object.keys(err.keyPattern)[0]
        });
    }

    res.status(err.status || 500).json({
        status: 'error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Database Connection and Server Initialization
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('MongoDB connected successfully');
    
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server is running on http://0.0.0.0:${PORT}`);
        console.log('Environment:', process.env.NODE_ENV || 'development');
    });
})
.catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

// Process Event Handlers
process.on('SIGINT', () => {
    mongoose.connection.close(() => {
        console.log('MongoDB connection closed through app termination');
        process.exit(0);
    });
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    mongoose.connection.close(() => {
        console.log('MongoDB connection closed due to uncaught exception');
        process.exit(1);
    });
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    mongoose.connection.close(() => {
        console.log('MongoDB connection closed due to unhandled rejection');
        process.exit(1);
    });
});

module.exports = app;
