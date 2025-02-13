# GPS Tracking Server

A real-time GPS tracking server application with support for multiple devices and historical data viewing.

## Features

- Real-time GPS tracking
- Multiple device support
- Historical data viewing
- Secure authentication
- Rate limiting and DDoS protection
- Comprehensive logging
- Error tracking and monitoring
- Role-based access control
- Dark mode support

## Quick Start with Docker

The easiest way to get started is using the pre-built Docker image from Docker Hub:

```bash
# Pull the image
docker pull c43211/tracking-server:latest

# Run the container
docker run -d \
  --name tracking-server \
  -p 3000:3000 \
  -e MONGODB_URI=mongodb://your-mongodb-uri \
  -e SESSION_SECRET=your-session-secret \
  c43211/tracking-server:latest
```

Or using Docker Compose:

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

Save this as `docker-compose.yml` and run:
```bash
docker-compose up -d
```

## Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and configure:
   ```bash
   cp .env.example .env
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3000 |
| NODE_ENV | Environment mode | development |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/trackingserver |
| SESSION_SECRET | Session encryption key | your_secret_key |
| JWT_SECRET | JWT signing key | your_jwt_secret_key |

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

## API Documentation

### Authentication Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Tracker Endpoints

- `GET /api/tracker/last-known-location` - Get last known locations
- `GET /api/tracker/history` - Get historical tracking data
- `POST /api/tracker/data` - Submit tracking data

## Support

For issues and support:
1. Check the [issues](https://github.com/ccgriffin/tracking-server/issues) section
2. Create a new issue with detailed information
3. Follow the issue template guidelines

## License

This project is licensed under the ISC License.
