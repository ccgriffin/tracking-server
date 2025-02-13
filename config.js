require('dotenv').config();

module.exports = {
    // Server configuration
    PORT: process.env.PORT || 3000,
    NODE_ENV: process.env.NODE_ENV || 'development',

    // MongoDB configuration
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/trackingserver',

    // Session configuration
    SESSION_SECRET: process.env.SESSION_SECRET || 'your_secret_key',
    
    // Security configuration
    COOKIE_SECURE: process.env.NODE_ENV === 'production'
};
