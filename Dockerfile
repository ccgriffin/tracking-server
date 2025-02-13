# Use Node.js LTS version with newer Alpine
FROM node:18-alpine3.19

# Install updated OpenSSL
RUN apk update && \
    apk upgrade && \
    apk add --no-cache openssl>=3.3.2-r5

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm ci --only=production

# Bundle app source
COPY . .

# Create volume for persistent data and logs
VOLUME ["/usr/src/app/data", "/usr/src/app/logs"]

# Create logs directory and set permissions
RUN mkdir -p /usr/src/app/logs && \
    chown -R node:node /usr/src/app/logs && \
    chown -R node:node /usr/src/app/public && \
    chmod +x /usr/src/app/scripts/setAdmin.js

# Add security measures
USER node

# Expose port
EXPOSE 3000

# Set NODE_ENV
ENV NODE_ENV=production

# Start the application
CMD [ "npm", "start" ]
