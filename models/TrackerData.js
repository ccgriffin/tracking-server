const mongoose = require('mongoose');

/**
 * @typedef {Object} TrackerDataSchema
 * @property {number} battery.level - Battery level percentage of the tracking device
 * @property {number} battery.voltage - Battery voltage of the tracking device
 * @property {number} channel.id - Communication channel identifier
 * @property {number} codec.id - Data codec identifier
 * @property {number} device.id - Unique device identifier
 * @property {string} device.name - Human-readable device name
 * @property {number} device.type.id - Device type identifier
 * @property {boolean} engine.ignition.status - Current ignition status
 * @property {number} escort.lls.temperature.3 - Temperature sensor reading
 * @property {number} event.priority.enum - Event priority level
 * @property {number} external.powersource.voltage - External power source voltage
 * @property {string} ident - Unique tracker identifier (required)
 * @property {string} peer - Peer connection information
 * @property {number} position.altitude - Current altitude in meters
 * @property {number} position.direction - Direction in degrees (0-360)
 * @property {number} position.latitude - Geographic latitude (required)
 * @property {number} position.longitude - Geographic longitude (required)
 * @property {number} position.satellites - Number of GPS satellites in view
 * @property {number} position.speed - Current speed in configured units
 * @property {number} protocol.id - Communication protocol identifier
 * @property {number} server.timestamp - Server-side timestamp
 * @property {Date} timestamp - Data timestamp (required)
 */

/**
 * Mongoose schema for tracking device data
 * @type {mongoose.Schema<TrackerDataSchema>}
 */
const trackerDataSchema = new mongoose.Schema({
    'battery.level': {
        type: Number,
        required: false
    },
    'battery.voltage': {
        type: Number,
        required: false
    },
    'channel.id': {
        type: Number,
        required: false
    },
    'codec.id': {
        type: Number,
        required: false
    },
    'device.id': {
        type: Number,
        required: false
    },
    'device.name': {
        type: String,
        required: false
    },
    'device.type.id': {
        type: Number,
        required: false
    },
    'engine.ignition.status': {
        type: Boolean,
        required: false
    },
    'escort.lls.temperature.3': {
        type: Number,
        required: false
    },
    'event.priority.enum': {
        type: Number,
        required: false
    },
    'external.powersource.voltage': {
        type: Number,
        required: false
    },
    'ident': {
        type: String,
        required: true
    },
    'peer': {
        type: String,
        required: false
    },
    'position.altitude': {
        type: Number,
        required: false
    },
    'position.direction': {
        type: Number,
        required: false
    },
    'position.latitude': {
        type: Number,
        required: true
    },
    'position.longitude': {
        type: Number,
        required: true
    },
    'position.satellites': {
        type: Number,
        required: false
    },
    'position.speed': {
        type: Number,
        required: false
    },
    'protocol.id': {
        type: Number,
        required: false
    },
    'server.timestamp': {
        type: Number,
        required: false
    },
    'timestamp': {
        type: Date,
        required: true,
        default: Date.now
    }
});

/**
 * Mongoose model for tracker data
 * @type {mongoose.Model<TrackerDataSchema>}
 */
const TrackerData = mongoose.model('TrackerData', trackerDataSchema);

module.exports = TrackerData;
