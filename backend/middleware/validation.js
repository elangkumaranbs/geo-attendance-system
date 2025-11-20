const { validationResult } = require('express-validator');

// Middleware to handle validation errors
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  
  next();
};

// Common validation rules
const { body, param, query } = require('express-validator');

exports.registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  
  body('userId')
    .trim()
    .notEmpty().withMessage('User ID is required')
    .isLength({ min: 3, max: 50 }).withMessage('User ID must be between 3 and 50 characters'),
  
  body('role')
    .optional()
    .isIn(['student', 'employee', 'admin']).withMessage('Invalid role'),
  
  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Department cannot exceed 100 characters'),
  
  body('phone')
    .optional({ checkFalsy: true })
    .trim(),
  
  body('gender')
    .optional({ checkFalsy: true })
    .isIn(['male', 'female', 'other']).withMessage('Invalid gender')
];

exports.loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required')
];

exports.attendanceValidation = [
  body('location.latitude')
    .notEmpty().withMessage('Latitude is required')
    .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
  
  body('location.longitude')
    .notEmpty().withMessage('Longitude is required')
    .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
  
  body('location.accuracy')
    .optional()
    .isFloat({ min: 0 }).withMessage('Accuracy must be a positive number'),
  
  body('faceImage')
    .optional()
    .notEmpty().withMessage('Face image is required for verification')
];

exports.geofenceValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Geofence name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  
  body('type')
    .notEmpty().withMessage('Type is required')
    .isIn(['campus', 'building', 'classroom', 'lab', 'office']).withMessage('Invalid geofence type'),
  
  body('center.latitude')
    .notEmpty().withMessage('Center latitude is required')
    .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
  
  body('center.longitude')
    .notEmpty().withMessage('Center longitude is required')
    .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
  
  body('radius')
    .notEmpty().withMessage('Radius is required')
    .isInt({ min: 10, max: 5000 }).withMessage('Radius must be between 10 and 5000 meters'),
  
  body('active')
    .optional()
    .isBoolean().withMessage('Active must be a boolean')
];

exports.idValidation = [
  param('id')
    .notEmpty().withMessage('ID is required')
    .isMongoId().withMessage('Invalid ID format')
];

exports.dateRangeValidation = [
  query('startDate')
    .optional()
    .isISO8601().withMessage('Start date must be a valid date'),
  
  query('endDate')
    .optional()
    .isISO8601().withMessage('End date must be a valid date')
];
