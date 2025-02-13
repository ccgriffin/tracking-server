const mongoose = require('mongoose');
const TrackerData = require('../models/TrackerData');

// Demo tracker configurations
const demoTrackers = [
    {
        ident: 'TRUCK001',
        deviceName: 'Delivery Truck 1',
        baseLocation: { lat: 51.5074, lng: -0.1278 }, // London
        route: 'delivery'
    },
    {
        ident: 'VAN002',
        deviceName: 'Service Van 2',
        baseLocation: { lat: 51.4545, lng: -0.9685 }, // Reading
        route: 'service'
    },
    {
        ident: 'CAR003',
        deviceName: 'Sales Car 3',
        baseLocation: { lat: 51.5142, lng: -0.0931 }, // City of London
        route: 'sales'
    },
    {
        ident: 'FLEET004',
        deviceName: 'Fleet Vehicle 4',
        baseLocation: { lat: 51.7520, lng: -1.2577 }, // Oxford
        route: 'fleet'
    }
];

// Generate random movement patterns
function generateRoutePoints(baseLocation, routeType, hours = 24) {
    const points = [];
    const now = new Date();
    const movePatterns = {
        delivery: { maxDist: 0.05, stopTime: 15, speed: 50 },
        service: { maxDist: 0.02, stopTime: 30, speed: 40 },
        sales: { maxDist: 0.03, stopTime: 45, speed: 35 },
        fleet: { maxDist: 0.04, stopTime: 20, speed: 45 }
    };

    const pattern = movePatterns[routeType];
    const updateInterval = 500; // 500ms between updates when moving
    const totalPoints = hours * 60 * 60 * 1000 / updateInterval;
    
    let currentLat = baseLocation.lat;
    let currentLng = baseLocation.lng;
    let currentDirection = Math.random() * 360;
    let isMoving = Math.random() > 0.3;
    let stopDuration = 0;
    let batteryLevel = 95;
    let lastBatteryUpdate = 0;

    for (let i = 0; i < totalPoints; i++) {
        const timestamp = new Date(now - (totalPoints - i) * updateInterval);
        
        // Update movement state every 5-15 minutes
        if (i % Math.floor(Math.random() * 600 + 300) === 0) {
            isMoving = Math.random() > 0.3;
            if (isMoving) {
                currentDirection = Math.random() * 360;
            } else {
                stopDuration = Math.floor(Math.random() * pattern.stopTime) * 60 * 1000;
            }
        }

        // Update battery level every hour
        if (timestamp - lastBatteryUpdate >= 3600000) {
            batteryLevel = Math.max(20, batteryLevel - Math.random() * 2);
            lastBatteryUpdate = timestamp;
        }

        if (isMoving) {
            // Calculate new position based on speed and direction
            const speed = pattern.speed * (0.8 + Math.random() * 0.4); // Speed variation
            const distance = speed * (updateInterval / 1000) / 3600; // Distance in degrees
            const directionRad = currentDirection * Math.PI / 180;
            
            currentLat += distance * Math.cos(directionRad);
            currentLng += distance * Math.sin(directionRad);

            // Keep within max distance from base
            const distFromBase = Math.sqrt(
                Math.pow(currentLat - baseLocation.lat, 2) + 
                Math.pow(currentLng - baseLocation.lng, 2)
            );
            if (distFromBase > pattern.maxDist) {
                // Turn around
                currentDirection = (currentDirection + 180) % 360;
            }

            const point = {
                timestamp,
                position: {
                    latitude: currentLat,
                    longitude: currentLng,
                    speed: speed,
                    direction: currentDirection,
                    satellites: Math.floor(Math.random() * 4) + 8
                },
                battery: {
                    level: batteryLevel,
                    voltage: 11.5 + (batteryLevel / 100) * 3
                },
                'external.powersource.voltage': isMoving ? 13.8 + Math.random() * 0.4 : 12.2 + Math.random() * 0.3,
                engine: {
                    ignition: {
                        status: isMoving
                    }
                },
                device: {
                    name: routeType.charAt(0).toUpperCase() + routeType.slice(1) + ' Vehicle'
                }
            };

            points.push(point);
        }
    }

    return points;
}

async function createDemoData() {
    try {
        await mongoose.connect('mongodb://localhost:27017/trackingserver', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        // Clear existing demo data
        await TrackerData.deleteMany({
            ident: { $in: demoTrackers.map(t => t.ident) }
        });

        // Generate and insert new demo data
        for (const tracker of demoTrackers) {
            const points = generateRoutePoints(tracker.baseLocation, tracker.route);
            const trackerData = points.map(point => ({
                ...point,
                ident: tracker.ident,
                'device.name': tracker.deviceName
            }));

            await TrackerData.insertMany(trackerData);
            console.log(`Created demo data for ${tracker.deviceName}`);
        }

        console.log('All demo tracker data created successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error creating demo data:', error);
        process.exit(1);
    }
}

createDemoData();
