const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

/**
 * @typedef {Object} UserSchema
 * @property {string} username - Unique username for the user
 * @property {string} password - Hashed password for user authentication
 * @property {string[]} trackers - Array of tracker identifiers associated with the user
 */

/**
 * Mongoose schema for user data
 * @type {mongoose.Schema<UserSchema>}
 */
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    trackers: {
        type: [String],
        required: true,
    },
});

/**
 * Pre-save middleware to hash the user's password before saving
 * @param {Function} next - Mongoose middleware next function
 */
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

/**
 * Compare a candidate password with the user's hashed password
 * @param {string} candidatePassword - The password to verify
 * @returns {Promise<boolean>} True if the password matches, false otherwise
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Mongoose model for user data
 * @type {mongoose.Model<UserSchema>}
 */
const User = mongoose.model('User', userSchema);

module.exports = User;
