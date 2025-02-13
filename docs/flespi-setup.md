# Setting Up Flespi Stream Integration

This guide explains how to configure Flespi to stream GPS data to your tracking server.

## Prerequisites

1. A Flespi account (sign up at [flespi.io](https://flespi.io))
2. Your tracking server deployed and accessible via HTTP/HTTPS
3. A GPS tracking device supported by Flespi

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
   Target URL: http://your-server:3000/api/flespi/data
   Content type: application/json
   ```

### 3. Data Format

The server accepts two data formats from Flespi:

#### Option 1: Direct JSON Array

```json
[
  {
    "ident": "device-id-here",
    "timestamp": 1234567890,
    "position": {
      "latitude": 0.0,
      "longitude": 0.0,
      "speed": 0,
      "altitude": 0,
      "direction": 0,
      "satellites": 0
    },
    "battery": {
      "level": 100,
      "voltage": 4.0
    },
    "engine": {
      "ignition": {
        "status": false
      }
    },
    "device": {
      "id": 123,
      "name": "device-name",
      "type": {
        "id": 456
      }
    },
    "external": {
      "powersource": {
        "voltage": 12.0
      }
    }
  }
]
```

#### Option 2: Raw HTTP Request Data

```json
{
  "timestamp": 1234567890.123,
  "type": 3,
  "conn": 23,
  "data": "POST /api/flespi/data HTTP/1.1\r\nHost: track.example.com\r\nContent-Type: application/json\r\n\r\n[{\"battery.level\":100,\"device.id\":123,\"device.name\":\"device-name\",\"position.latitude\":0.0,\"position.longitude\":0.0}]"
}
```

### 4. Data Mapping

Configure the stream data mapping:

```json
{
  "ident": "%.device.id",
  "timestamp": "%.timestamp",
  "position": {
    "latitude": "%.position.latitude",
    "longitude": "%.position.longitude",
    "speed": "%.position.speed",
    "altitude": "%.position.altitude",
    "direction": "%.position.direction",
    "satellites": "%.position.satellites"
  },
  "battery": {
    "level": "%.battery.level",
    "voltage": "%.battery.voltage"
  },
  "engine": {
    "ignition": {
      "status": "%.engine.ignition.status"
    }
  },
  "device": {
    "id": "%.device.id",
    "name": "%.device.name",
    "type": {
      "id": "%.device.type.id"
    }
  },
  "external": {
    "powersource": {
      "voltage": "%.external.powersource.voltage"
    }
  }
}
```

### 5. Testing the Integration

1. Monitor incoming data:
```bash
# View server logs
docker compose logs -f tracking-server

# Check MongoDB data
docker compose exec mongodb mongosh trackingserver --eval "db.trackerdata.find().sort({timestamp:-1}).limit(1)"
```

2. Example successful response:
```json
{
  "message": "Data received successfully",
  "count": 3
}
```

### 6. Troubleshooting

1. Check server logs for detailed error messages:
```bash
docker compose logs -f tracking-server
```

2. Common issues:
   - Missing required fields (ident, timestamp, position)
   - Invalid data format
   - Network connectivity issues
   - Invalid timestamp format

3. Validation errors:
   - All position fields must be numeric
   - Battery level must be between 0 and 100
   - Timestamp must be a valid Unix timestamp

### 7. Production Configuration

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

### 8. Data Storage

The server stores the following data:

1. Core Fields:
   - Device identifier
   - Timestamp
   - Position (lat/long)
   - Speed
   - Altitude
   - Direction
   - Satellite count

2. Device Info:
   - Battery level/voltage
   - Engine status
   - Device name/ID
   - External power info

3. Metadata:
   - Codec information
   - Event details
   - Channel info
   - Protocol data
   - Server timestamps

### 9. Best Practices

1. Data Quality:
   - Validate GPS coordinates
   - Check timestamp accuracy
   - Monitor battery levels
   - Track device status

2. Performance:
   - Use batch updates when possible
   - Monitor data volume
   - Set up data retention policies
   - Configure appropriate indexes

3. Security:
   - Use HTTPS in production
   - Monitor for unusual patterns
   - Set up alerts for device issues
   - Regular backup of tracking data

## Support

For additional assistance:
1. Check server logs for detailed error messages
2. Review Flespi documentation at [docs.flespi.io](https://docs.flespi.io)
3. Contact system administrator
4. Create GitHub issue for bugs
