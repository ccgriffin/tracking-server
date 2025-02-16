const mongoose = require('mongoose');
const TrackerData = require('../models/TrackerData');

// Create data points for the last 7 days
function generateHistoricalData(baseTracker, daysOfHistory = 7) {
    const dataPoints = [];
    const now = Math.floor(Date.now() / 1000);
    const dayInSeconds = 24 * 60 * 60;
    
    for (let day = 0; day < daysOfHistory; day++) {
        // Create 24 points per day (one per hour)
        for (let hour = 0; hour < 24; hour++) {
            const timestamp = now - (day * dayInSeconds) - (hour * 3600);
            
            // Add some variation to position and speed
            const latVariation = (Math.random() - 0.5) * 0.01;
            const lonVariation = (Math.random() - 0.5) * 0.01;
            const speedVariation = Math.floor(Math.random() * 60);
            
            dataPoints.push({
                ...baseTracker,
                "timestamp": timestamp,
                "server.timestamp": timestamp,
                "position.latitude": baseTracker["position.latitude"] + latVariation,
                "position.longitude": baseTracker["position.longitude"] + lonVariation,
                "position.speed": speedVariation,
                "battery.level": 100 - (Math.floor(Math.random() * 20)), // Random battery level between 80-100
                "engine.ignition.status": Math.random() > 0.3 // 70% chance of being on
            });
        }
    }
    
    return dataPoints;
}

// Demo tracker configurations
const demoTrackers = [
    {
        "channel.id": 1234567,
        "peer": "xxx.xxx.xxx.xxx:xxxxx",
        "protocol.id": 14,
        "device.id": 1234567,
        "device.name": "Delivery Truck 1",
        "device.type.id": 123,
        "ident": "TRUCK001",
        "position.latitude": 51.5074,
        "position.longitude": -0.1278,
        "position.speed": 0,
        "position.direction": 0,
        "position.satellites": 10,
        "position.altitude": 100,
        "alarm.event": false,
        "crash.event": false,
        "event.enum": 247,
        "event.priority.enum": 2
    },
    {
        "channel.id": 1234567,
        "peer": "xxx.xxx.xxx.xxx:xxxxx",
        "protocol.id": 14,
        "device.id": 1234567,
        "device.name": "Service Van 2",
        "device.type.id": 123,
        "ident": "VAN002",
        "position.latitude": 51.4545,
        "position.longitude": -0.9685,
        "position.speed": 0,
        "position.direction": 0,
        "position.satellites": 10,
        "position.altitude": 100,
        "alarm.event": false,
        "crash.event": false,
        "event.enum": 247,
        "event.priority.enum": 2
    },
    {
        "channel.id": 1234567,
        "peer": "xxx.xxx.xxx.xxx:xxxxx",
        "protocol.id": 14,
        "device.id": 1234567,
        "device.name": "Sales Car 3",
        "device.type.id": 123,
        "ident": "CAR003",
        "position.latitude": 51.5142,
        "position.longitude": -0.0931,
        "position.speed": 0,
        "position.direction": 0,
        "position.satellites": 10,
        "position.altitude": 100,
        "alarm.event": false,
        "crash.event": false,
        "event.enum": 247,
        "event.priority.enum": 2
    },
    {
        "channel.id": 1234567,
        "peer": "xxx.xxx.xxx.xxx:xxxxx",
        "protocol.id": 14,
        "device.id": 1234567,
        "device.name": "Fleet Vehicle 4",
        "device.type.id": 123,
        "ident": "FLEET004",
        "position.latitude": 51.7520,
        "position.longitude": -1.2577,
        "position.speed": 0,
        "position.direction": 0,
        "position.satellites": 10,
        "position.altitude": 100,
        "alarm.event": false,
        "crash.event": false,
        "event.enum": 247,
        "event.priority.enum": 2
    }
];

async function createDemoData() {
    try {
        await mongoose.connect('mongodb://localhost:27017/trackingserver', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        // Generate historical data for each tracker
        const allDataPoints = [];
        for (const tracker of demoTrackers) {
            const historicalData = generateHistoricalData(tracker);
            allDataPoints.push(...historicalData);
        }

        // Clear existing demo data
        await TrackerData.deleteMany({
            ident: { $in: demoTrackers.map(t => t.ident) }
        });

        // Insert all data points
        await TrackerData.insertMany(allDataPoints);
        console.log(`Created ${allDataPoints.length} historical data points for demo trackers`);
        process.exit(0);
    } catch (error) {
        console.error('Error creating demo data:', error);
        process.exit(1);
    }
}

createDemoData();
