const mongoose = require('mongoose');

const trackerDataSchema = new mongoose.Schema({
    ident: {
        type: String,
        required: true,
        index: true
    },
    timestamp: {
        type: Date,
        required: true,
        index: true
    },
    position: {
        latitude: {
            type: Number,
            required: true
        },
        longitude: {
            type: Number,
            required: true
        },
        speed: {
            type: Number,
            default: 0
        },
        altitude: {
            type: Number,
            default: 0
        },
        direction: {
            type: Number,
            default: 0
        },
        satellites: {
            type: Number,
            default: 0
        }
    },
    battery: {
        level: {
            type: Number,
            min: 0,
            max: 100
        },
        voltage: {
            type: Number
        }
    },
    engine: {
        ignition: {
            status: {
                type: Boolean,
                default: false
            }
        }
    },
    device: {
        id: {
            type: Number
        },
        name: {
            type: String
        },
        type: {
            id: {
                type: Number
            }
        }
    },
    external: {
        powersource: {
            voltage: {
                type: Number
            }
        }
    },
    metadata: {
        codec: {
            id: Number
        },
        event: {
            enum: Number,
            priority: {
                enum: Number
            }
        },
        channel: {
            id: Number
        },
        protocol: {
            id: Number
        },
        server: {
            timestamp: Date
        },
        rest: {
            timestamp: Date
        }
    }
}, {
    timestamps: true
});

// Indexes for faster queries
trackerDataSchema.index({ 'device.id': 1 });
trackerDataSchema.index({ 'device.name': 1 });
trackerDataSchema.index({ 'engine.ignition.status': 1 });
trackerDataSchema.index({ createdAt: 1 });

const TrackerData = mongoose.model('TrackerData', trackerDataSchema);

module.exports = TrackerData;
