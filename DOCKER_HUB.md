# GPS Tracking Server

A secure and scalable GPS tracking server built with Node.js, Express, and MongoDB. Perfect for fleet management, asset tracking, and IoT applications.

## Key Features

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

```bash
# Pull the image
docker pull c43211/tracking-server:latest

# Run with basic configuration
docker run -d \
  --name tracking-server \
  -p 3000:3000 \
  -e MONGODB_URI=mongodb://your-mongodb-uri \
  -e SESSION_SECRET=your-session-secret \
  c43211/tracking-server:latest
```

## Docker Compose

```yaml
version: '3.8'
services:
  tracking-server:
    image: c43211/tracking-server:latest
    ports:
      - "3000:3000"
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/trackingserver
      - SESSION_SECRET=your-session-secret
    depends_on:
      - mongodb
  
  mongodb:
    image: mongo:latest
    volumes:
      - mongodb_data:/data/db

volumes:
  mongodb_data:
```

## Environment Variables

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode (default: production)
- `MONGODB_URI` - MongoDB connection string
- `SESSION_SECRET` - Session encryption key
- `JWT_SECRET` - JWT signing key

## Security Features

- Session-based authentication with JWT support
- Role-based access control
- Account locking after failed attempts
- Rate limiting and CORS protection
- XSS prevention and security headers
- Request size limiting
- Structured logging and monitoring

## Source Code

Visit our [GitHub repository](https://github.com/ccgriffin/tracking-server) for more information, documentation, and source code.

## Tags

- `latest` - Latest stable release
- `1.0.1` - Version 1.0.1 with security updates
- `1.0.0` - Initial release

## Support

For issues and support, please visit our [GitHub Issues](https://github.com/ccgriffin/tracking-server/issues) page.
