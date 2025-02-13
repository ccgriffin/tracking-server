# Setting Up Flespi Stream Integration

This guide explains how to configure Flespi to stream GPS data to your tracking server.

## Prerequisites

1. A Flespi account (sign up at [flespi.io](https://flespi.io))
2. Your tracking server deployed and accessible via HTTPS
3. Authentication credentials for your tracking server

## Configuration Steps

### 1. Create a Flespi Channel

1. Log in to your Flespi account
2. Navigate to "Channels" in the left sidebar
3. Click "Create channel"
4. Select your device protocol (e.g., "GPRS" for generic GPS trackers)
5. Configure the channel settings:
   - Name: Give your channel a descriptive name
   - Protocol: Select your device protocol
   - Server: Leave as default if using Flespi's servers

### 2. Configure HTTP Stream

1. Go to "Streams" in the Flespi panel
2. Click "Create stream"
3. Configure the stream:
   ```
   Name: Tracking Server Stream
   Target URL: https://your-server.com/api/tracker/data
   Content type: application/json
   ```

4. Configure the data mapping:
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
     "external.powersource.voltage": "%.external.powersource.voltage",
     "device": {
       "name": "%.device.name"
     },
     "server.timestamp": "%.server.timestamp"
   }
   ```

### 3. Set Up Authentication

1. Add HTTP headers in stream configuration:
   ```
   Authorization: Bearer your-api-token
   ```

2. Enable SSL/TLS verification if your server uses HTTPS

### 4. Testing the Integration

1. Register a device in Flespi:
   - Go to "Devices"
   - Click "Create device"
   - Select the channel you created
   - Enter device identifier

2. Monitor data flow:
   - Use Flespi toolbox to verify device messages
   - Check stream status in Flespi panel
   - Verify data reception in your tracking server logs

### 5. Production Configuration

1. Set up error notifications:
   ```
   Stream settings > Notifications
   Enable email alerts for delivery failures
   ```

2. Configure retry settings:
   ```
   Max retries: 3
   Retry interval: 60 seconds
   ```

3. Enable stream logging for debugging

## Troubleshooting

### Common Issues

1. Data not reaching server:
   - Verify stream status in Flespi
   - Check server logs for incoming requests
   - Verify authentication headers
   - Ensure server URL is accessible

2. Invalid data format:
   - Review data mapping configuration
   - Check device message format
   - Verify JSON payload structure

3. Authentication failures:
   - Confirm API token is valid
   - Check authorization header format
   - Verify server authentication settings

### Debugging Tools

1. Flespi Toolbox:
   - View raw device messages
   - Test stream configuration
   - Monitor message flow

2. Stream Logs:
   - Enable debug logging
   - Check delivery status
   - View error messages

## Best Practices

1. Security:
   - Use HTTPS for data transmission
   - Rotate API tokens periodically
   - Implement IP whitelisting if possible

2. Monitoring:
   - Set up alerts for stream failures
   - Monitor message delivery rates
   - Track data quality metrics

3. Performance:
   - Optimize message size
   - Configure appropriate retry settings
   - Monitor server response times

## Example Configurations

### Basic Stream Configuration
```json
{
  "name": "GPS Tracking Stream",
  "uri": "https://your-server.com/api/tracker/data",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer your-api-token"
  },
  "verify_ssl": true,
  "buffer_size": 1000,
  "retry_count": 3,
  "retry_delay": 60
}
```

### Advanced Data Mapping
```json
{
  "custom_fields": {
    "device_info": {
      "serial": "%.device.serial",
      "model": "%.device.model",
      "firmware": "%.device.firmware"
    },
    "telemetry": {
      "odometer": "%.position.odometer",
      "fuel": "%.engine.fuel.level",
      "temperature": "%.sensors.temperature"
    }
  }
}
```

## Support

For additional support:
1. Flespi Documentation: [docs.flespi.io](https://docs.flespi.io)
2. Tracking Server Issues: Create a GitHub issue
3. Email Support: Contact your system administrator
