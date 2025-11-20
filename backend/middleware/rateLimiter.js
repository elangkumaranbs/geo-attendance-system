const rateLimit = require('express-rate-limit');

// General API rate limiter - DISABLED for development
exports.apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000, // Effectively unlimited
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth limiter - DISABLED for development
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000, // Effectively unlimited
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Face verification limiter - DISABLED for development
exports.faceLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10000, // Effectively unlimited
  message: {
    success: false,
    message: 'Too many face verification attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Attendance marking limiter - DISABLED for development
exports.attendanceLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10000, // Effectively unlimited
  message: {
    success: false,
    message: 'Too many attendance marking attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
