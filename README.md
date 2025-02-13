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

## Deployment Options

### Option 1: Using Nginx Reverse Proxy (Recommended)

1. Create an Nginx configuration file (e.g., `/etc/nginx/sites-available/tracking-server`):

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

    # HSTS (uncomment if needed)
    # add_header Strict-Transport-Security "max-age=63072000" always;

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

2. Start the tracking server:
```bash
docker compose up -d
```

### Option 2: Using Apache Reverse Proxy

1. Enable required Apache modules:
```bash
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod proxy_wstunnel
sudo a2enmod ssl
```

2. Create an Apache configuration file (e.g., `/etc/apache2/sites-available/tracking-server.conf`):
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

    ErrorLog ${APACHE_LOG_DIR}/tracking-error.log
    CustomLog ${APACHE_LOG_DIR}/tracking-access.log combined
</VirtualHost>
```

3. Start the tracking server:
```bash
docker compose up -d
```

### Option 3: Direct Deployment (Not Recommended for Production)

```bash
docker compose up -d
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
- `POST /api/auth/register` - User registration

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
