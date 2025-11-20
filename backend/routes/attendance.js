const express = require('express');
const router = express.Router();
const {
  markAttendance,
  markCheckout,
  getMyAttendance,
  getTodayAttendance,
  getAllAttendance,
  getAttendanceStats
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');
const { attendanceValidation, validate, dateRangeValidation } = require('../middleware/validation');

// User routes
router.post('/mark', protect, attendanceValidation, validate, markAttendance);
router.post('/checkout', protect, markCheckout);
router.get('/my-records', protect, dateRangeValidation, validate, getMyAttendance);
router.get('/today', protect, getTodayAttendance);
router.get('/stats', protect, getAttendanceStats);

// Admin routes
router.get('/all', protect, authorize('admin'), getAllAttendance);

module.exports = router;
