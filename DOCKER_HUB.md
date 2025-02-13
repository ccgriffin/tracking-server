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

## Setting Up Admin Users

The image includes a script to easily promote users to admin status. Here's how to use it:

1. First, create a regular user through the registration page.

2. Then promote the user to admin using the included script:
```bash
# Using Docker Compose
docker compose exec tracking-server node scripts/setAdmin.js username

# Using standalone container
docker exec tracking-server node scripts/setAdmin.js username
```

Replace `username` with the actual username you want to promote.

Example output:
```
User admin1 is now an admin
```

You can also set up an admin user during container initialization:

```yaml
services:
  tracking-server:
    image: c43211/tracking-server:latest
    environment:
      - ADMIN_USERNAME=admin
      - ADMIN_PASSWORD=your-secure-password
      - ADMIN_EMAIL=admin@example.com
```

## Setting Up Flespi Stream

### 1. Create Flespi Channel

1. Sign up at [flespi.io](https://flespi.io)
2. Go to "Channels" → "Create channel"
3. Select device protocol (e.g., "GPRS")
4. Configure basic settings:
   ```
   Name: Your Channel Name
   Protocol: Your Device Protocol
   ```

### 2. Configure HTTP Stream

1. Go to "Streams" → "Create stream"
2. Configure stream settings:
   ```
   Name: Tracking Server Stream
   Target URL: http://your-server:3000/api/flespi/data
   Content type: application/json
   ```

3. Set up data mapping:
   ```json
   {
     "ident": "%.device.id",
     "timestamp": "%.timestamp",
     "position": {
       "latitude": "%.position.latitude",
       "longitude": "%.position.longitude",
       "speed": "%.position.speed"
     },
     "battery": {
       "level": "%.battery.level"
     },
     "engine": {
       "ignition": {
         "status": "%.engine.ignition"
       }
     },
     "device": {
       "name": "%.device.name"
     }
   }
   ```

### 3. Testing the Integration

1. Monitor incoming data:
```bash
# View server logs
docker compose logs -f tracking-server

# Check MongoDB data
docker compose exec mongodb mongosh trackingserver --eval "db.trackerdata.find().sort({timestamp:-1}).limit(1)"
```

## Environment Variables

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode (default: production)
- `MONGODB_URI` - MongoDB connection string
- `SESSION_SECRET` - Session encryption key
- `JWT_SECRET` - JWT signing key
- `ADMIN_USERNAME` - Initial admin username (optional)
- `ADMIN_PASSWORD` - Initial admin password (optional)
- `ADMIN_EMAIL` - Initial admin email (optional)

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
