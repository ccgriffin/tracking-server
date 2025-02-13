# GPS Tracking Server

A secure and scalable GPS tracking server built with Node.js, Express, and MongoDB. Perfect for fleet management, asset tracking, and IoT applications.

## Features

- 🛰️ Real-time GPS tracking
- 📱 Multiple device support
- 📊 Historical data viewing
- 🔒 Secure authentication
- 🛡️ Rate limiting and DDoS protection
- 📝 Comprehensive logging
- 🚨 Error tracking and monitoring
- 👥 Role-based access control
- 🌓 Dark mode support

## Quick Start

1. Clone the repository:
```bash
git clone https://github.com/ccgriffin/tracking-server.git
cd tracking-server
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
# Edit .env with your settings
```

4. Start the server:
```bash
npm start
```

## Docker Deployment

See [DOCKER_HUB.md](DOCKER_HUB.md) for detailed Docker deployment instructions.

## Documentation

- [Admin Setup Guide](docs/admin-setup.md) - Setting up and managing admin users
- [Flespi Integration](docs/flespi-setup.md) - Configuring Flespi GPS data streaming
- [GitHub Setup](docs/github-setup.md) - Setting up GitHub integration

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3000 |
| NODE_ENV | Environment mode | development |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/trackingserver |
| SESSION_SECRET | Session encryption key | your_secret_key |
| JWT_SECRET | JWT signing key | your_jwt_secret_key |

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/register` - User registration

### Tracker Management
- `GET /api/tracker/list` - List user's trackers
- `POST /api/tracker/add` - Add tracker to user
- `DELETE /api/tracker/remove/:id` - Remove tracker
- `GET /api/tracker/history/:id` - Get tracker history
- `POST /api/tracker/data` - Receive tracker data (Flespi)

### Admin
- `GET /api/admin/users` - List all users
- `PUT /api/admin/users/role` - Update user role
- `GET /api/admin/trackers` - List all trackers
- `DELETE /api/admin/users/:id` - Delete user

## Security Features

1. Authentication & Authorization
   - Session-based authentication
   - JWT support
   - Role-based access control
   - Account locking after failed attempts
   - Password complexity requirements

2. API Security
   - Rate limiting
   - CORS protection
   - XSS prevention
   - Security headers
   - Request size limiting

3. Logging & Monitoring
   - Structured logging
   - Error tracking
   - Request logging
   - Security event logging

## Development

1. Start in development mode:
```bash
npm run dev
```

2. Run tests:
```bash
npm test
```

3. Create demo data:
```bash
npm run demo
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Support

For issues and support:
1. Check the [issues](https://github.com/ccgriffin/tracking-server/issues) section
2. Create a new issue with detailed information
3. Follow the issue template guidelines

## License

This project is licensed under the ISC License.
