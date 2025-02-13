const { validationResult, body, param, query } = require('express-validator');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            status: 'error',
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    next();
};

// Login validation rules
const loginValidation = [
    body('username')
        .trim()
        .notEmpty().withMessage('Username is required')
        .isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    handleValidationErrors
];

// Tracker data validation rules
const trackerDataValidation = [
    body('ident')
        .notEmpty().withMessage('Tracker identifier is required')
        .isString().withMessage('Tracker identifier must be a string'),
    body('position.latitude')
        .notEmpty().withMessage('Latitude is required')
        .isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude value'),
    body('position.longitude')
        .notEmpty().withMessage('Longitude is required')
        .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude value'),
    body('timestamp')
        .notEmpty().withMessage('Timestamp is required')
        .isNumeric().withMessage('Timestamp must be a number'),
    handleValidationErrors
];

// History query validation rules
const historyValidation = [
    query('start')
        .notEmpty().withMessage('Start date is required')
        .isISO8601().withMessage('Start date must be a valid ISO 8601 date'),
    query('end')
        .notEmpty().withMessage('End date is required')
        .isISO8601().withMessage('End date must be a valid ISO 8601 date'),
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000'),
    query('interval')
        .optional()
        .isIn(['raw', 'minute', 'hour', 'day']).withMessage('Invalid interval value'),
    handleValidationErrors
];

// Password validation rules
const passwordValidation = [
    body('password')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
        .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
        .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
        .matches(/[0-9]/).withMessage('Password must contain at least one number')
        .matches(/[!@#$%^&*]/).withMessage('Password must contain at least one special character'),
    handleValidationErrors
];

module.exports = {
    handleValidationErrors,
    loginValidation,
    trackerDataValidation,
    historyValidation,
    passwordValidation
};
