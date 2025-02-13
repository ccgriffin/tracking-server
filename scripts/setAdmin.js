const mongoose = require('mongoose');
const User = require('../models/User');

const username = process.argv[2];
if (!username) {
    console.error('Please provide a username');
    process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/trackingserver')
    .then(async () => {
        const user = await User.findOne({ username });
        if (!user) {
            console.error('User not found');
            process.exit(1);
        }

        user.role = 'admin';
        await user.save();
        console.log(`User ${username} is now an admin`);
        process.exit(0);
    })
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
