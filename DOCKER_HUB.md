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

## Deployment Options

### Option 1: Using Nginx Reverse Proxy (Recommended)

1. Create a `docker-compose.yml` file:
```yaml
services:
  tracking-server:
    image: c43211/tracking-server:latest
    ports:
      - "127.0.0.1:3000:3000"  # Only accessible locally
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

2. Create an Nginx configuration (e.g., `/etc/nginx/sites-available/tracking-server`):
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /path/to/your/fullchain.pem;
    ssl_certificate_key /path/to/your/privkey.pem;

    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

3. Start the services:
```bash
# Create .env file with your secret
echo "SESSION_SECRET=your-secret-here" > .env

# Start the services
docker compose up -d
```

### Option 2: Using Apache Reverse Proxy

1. Create a `docker-compose.yml` file (same as above)

2. Configure Apache:
```apache
<VirtualHost *:80>
    ServerName your-domain.com
    Redirect permanent / https://your-domain.com/
</VirtualHost>

<VirtualHost *:443>
    ServerName your-domain.com
    
    SSLEngine on
    SSLCertificateFile /path/to/your/fullchain.pem
    SSLCertificateKeyFile /path/to/your/privkey.pem

    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/

    RequestHeader set X-Forwarded-Proto "https"
    RequestHeader set X-Forwarded-Port "443"
</VirtualHost>
```

3. Start the services:
```bash
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
