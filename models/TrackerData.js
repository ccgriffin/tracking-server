const mongoose = require('mongoose');

const trackerDataSchema = new mongoose.Schema({
    ident: {
        type: String,
        required: true,
        index: true
    },
    timestamp: {
        type: Number,
        required: true,
        index: true
    }
}, { 
    strict: false,  // Allow any fields from Flespi
    timestamps: true
});

// Indexes for faster queries
trackerDataSchema.index({ 'device.id': 1 });
trackerDataSchema.index({ 'device.name': 1 });
trackerDataSchema.index({ 'engine.ignition.status': 1 });
trackerDataSchema.index({ createdAt: 1 });

const TrackerData = mongoose.model('TrackerData', trackerDataSchema);

module.exports = TrackerData;
