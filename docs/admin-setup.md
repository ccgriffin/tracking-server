# Setting Up Admin Users

This guide explains how to set up and manage admin users in the GPS Tracking Server.

## Method 1: Using MongoDB Shell

1. Connect to MongoDB:
```bash
# If using Docker Compose
docker exec -it mongodb mongosh

# If using standalone MongoDB
mongosh
```

2. Switch to the tracking database:
```javascript
use trackingserver
```

3. Update a user to admin role:
```javascript
// Replace 'username' with the actual username
db.users.updateOne(
  { username: "username" },
  { $set: { role: "admin" } }
)
```

## Method 2: Using the Setup Script

1. Create a setup file (e.g., `scripts/setAdmin.js`):
```javascript
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
```

2. Run the script:
```bash
# If using Node directly
node scripts/setAdmin.js username

# If using Docker Compose
docker compose exec tracking-server node scripts/setAdmin.js username
```

## Method 3: Using Docker Environment

1. Create an admin user during container initialization by setting environment variables:

```yaml
# docker-compose.yml
services:
  tracking-server:
    image: c43211/tracking-server:latest
    environment:
      - ADMIN_USERNAME=admin
      - ADMIN_PASSWORD=your-secure-password
      - ADMIN_EMAIL=admin@example.com
```

## Method 4: Using the Admin API

1. First, log in as an existing admin:
```bash
curl -X POST http://your-server:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "your-password"}'
```

2. Use the returned token to promote a user to admin:
```bash
curl -X PUT http://your-server:3000/api/admin/users/role \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{
    "username": "user-to-promote",
    "role": "admin"
  }'
```

## Verifying Admin Status

1. Check user role in MongoDB:
```javascript
db.users.findOne({ username: "username" })
```

2. Test admin access:
```bash
# Try accessing the admin panel
curl http://your-server:3000/admin \
  -H "Cookie: connect.sid=your-session-cookie"
```

## Security Considerations

1. Password Requirements:
   - Minimum 8 characters
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one number
   - At least one special character

2. Access Control:
   - Admin accounts should use 2FA when possible
   - Regular audit of admin accounts
   - Immediate removal of unused admin accounts

3. Best Practices:
   - Use strong, unique passwords
   - Change admin passwords regularly
   - Monitor admin account activity
   - Limit number of admin accounts
   - Document all admin account changes

## Troubleshooting

1. User not found:
   - Verify username spelling
   - Check database connection
   - Ensure user exists in the system

2. Permission issues:
   - Verify MongoDB connection string
   - Check database user permissions
   - Ensure proper authentication

3. Role not updating:
   - Check MongoDB write permissions
   - Verify user document structure
   - Ensure proper role value ("admin")

## Support

For additional assistance:
1. Check server logs for errors
2. Review MongoDB logs
3. Contact system administrator
4. Create GitHub issue for bugs

## Example Scripts

### Batch Admin Creation
```javascript
const admins = [
  { username: 'admin1', email: 'admin1@example.com' },
  { username: 'admin2', email: 'admin2@example.com' }
];

async function promoteToAdmin(username) {
  const user = await User.findOne({ username });
  if (user) {
    user.role = 'admin';
    await user.save();
    console.log(`${username} promoted to admin`);
  }
}

admins.forEach(admin => promoteToAdmin(admin.username));
```

### Admin Role Verification
```javascript
async function verifyAdmin(username) {
  const user = await User.findOne({ username });
  if (user?.role === 'admin') {
    console.log(`${username} is an admin`);
    return true;
  }
  console.log(`${username} is not an admin`);
  return false;
}
