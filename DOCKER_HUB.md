# GPS Tracking Server

A secure and scalable GPS tracking server built with Node.js, Express, and MongoDB. Perfect for fleet management, asset tracking, and IoT applications.

## Docker Hub Repository

The official Docker image is available at [hub.docker.com/r/c43211/tracking-server](https://hub.docker.com/r/c43211/tracking-server)

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

### Option 1: Using Docker Hub Image

Create a `docker-compose.yml` file:

```yaml
services:
  tracking-server:
    image: c43211/tracking-server:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongodb:27017/trackingserver
      - SESSION_SECRET=${SESSION_SECRET}
    depends_on:
      - mongodb
    restart: unless-stopped
    networks:
      - app-network
    volumes:
      - app-data:/usr/src/app/data
      - app-logs:/usr/src/app/logs

  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongodb-data:/data/db
    networks:
      - app-network
    restart: unless-stopped

networks:
  app-network:
    driver: bridge

volumes:
  mongodb-data:
  app-data:
  app-logs:
```

Then run:
```bash
# Create .env file with your secret
echo "SESSION_SECRET=your-secret-here" > .env

# Pull and start the services
docker compose up -d
```

### Option 2: Run Individual Container

If you have your own MongoDB instance:

```bash
# Create volumes for data and logs
docker volume create tracking-data
docker volume create tracking-logs

# Pull and run the container
docker pull c43211/tracking-server:latest

docker run -d \
  --name tracking-server \
  -p 3000:3000 \
  -e MONGODB_URI=mongodb://your-mongodb-uri \
  -e SESSION_SECRET=your-session-secret \
  -e NODE_ENV=production \
  -v tracking-data:/usr/src/app/data \
  -v tracking-logs:/usr/src/app/logs \
  c43211/tracking-server:latest
```

### Option 3: Build from Source

If you prefer to build the image yourself:

1. Clone the repository from [GitHub](https://github.com/ccgriffin/tracking-server)
2. Build and run:
```bash
docker compose build
docker compose up -d
```

## Environment Variables

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode (default: production)
- `MONGODB_URI` - MongoDB connection string
- `SESSION_SECRET` - Session encryption key
- `JWT_SECRET` - JWT signing key

## Volumes

The application uses three Docker volumes:
- `app-data`: For persistent application data
- `app-logs`: For application logs
- `mongodb-data`: For MongoDB data

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
