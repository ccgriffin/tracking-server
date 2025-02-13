const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');

async function createDemoUser() {
    try {
        await mongoose.connect('mongodb://localhost:27017/trackingserver', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        const demoUser = {
            username: 'demo',
            password: await bcrypt.hash('demo123', 10),
            email: 'demo@example.com',
            role: 'user'
        };

        await User.findOneAndUpdate(
            { username: demoUser.username },
            demoUser,
            { upsert: true }
        );

        console.log('Demo user created successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error creating demo user:', error);
        process.exit(1);
    }
}

createDemoUser();
