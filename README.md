# GPS Tracking Server

A real-time GPS tracking server application with support for multiple devices and historical data viewing.

## Deployment Guide

### Prerequisites
- Node.js >= 14.0.0
- MongoDB >= 4.4
- Docker (optional)
- Docker Compose (optional)

### Local Development
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

### Docker Deployment
1. Build and run with Docker Compose:
   ```bash
   # Start the application
   docker-compose up -d

   # View logs
   docker-compose logs -f

   # Stop the application
   docker-compose down
   ```

### Cloud Deployment Options

#### Heroku
1. Install Heroku CLI and login:
   ```bash
   heroku login
   ```
2. Create new Heroku app:
   ```bash
   heroku create your-app-name
   ```
3. Add MongoDB addon:
   ```bash
   heroku addons:create mongolab
   ```
4. Configure environment variables:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set SESSION_SECRET=your-secret-key
   ```
5. Deploy:
   ```bash
   git push heroku main
   ```

#### Digital Ocean App Platform
1. Fork this repository to your GitHub account
2. Connect your GitHub account to Digital Ocean
3. Create a new app from your repository
4. Configure environment variables:
   - `NODE_ENV=production`
   - `SESSION_SECRET=your-secret-key`
   - `MONGODB_URI` (from MongoDB Atlas or managed database)
5. Deploy the application

#### AWS Elastic Beanstalk
1. Install AWS EB CLI
2. Initialize EB application:
   ```bash
   eb init
   ```
3. Create environment:
   ```bash
   eb create
   ```
4. Configure environment variables in EB Console
5. Deploy:
   ```bash
   eb deploy
   ```

### Production Considerations

1. Database
   - Use MongoDB Atlas or a managed database service
   - Enable database backups
   - Configure proper authentication and network security

2. Security
   - Set strong SESSION_SECRET
   - Enable HTTPS
   - Configure proper CORS settings
   - Implement rate limiting
   - Regular security updates

3. Monitoring
   - Set up application monitoring
   - Configure error tracking
   - Enable performance monitoring
   - Set up alerts for critical issues

4. Scaling
   - Use load balancer for multiple instances
   - Configure auto-scaling rules
   - Optimize database queries
   - Implement caching where appropriate

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3000 |
| NODE_ENV | Environment mode | development |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/trackingserver |
| SESSION_SECRET | Session encryption key | your_secret_key |

### Health Checks

The application provides health check endpoints:
- `/health` - Basic application health
- `/api/health` - API health status

### Backup and Recovery

1. Database Backups:
   ```bash
   # Using mongodump
   mongodump --uri="your-mongodb-uri" --out=backup/

   # Restore
   mongorestore --uri="your-mongodb-uri" backup/
   ```

2. Application Data:
   - All data is stored in MongoDB
   - Docker volumes persist data between container restarts
   - Regular backups recommended

### Support

For issues and support:
1. Check the [issues](https://github.com/your-repo/issues) section
2. Create a new issue with detailed information
3. Follow the issue template guidelines

## License

This project is licensed under the ISC License.
