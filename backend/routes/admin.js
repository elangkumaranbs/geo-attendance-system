const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  registerFaceForUser,
  getAllUsers,
  getUserDetails,
  deleteUser,
  updateUserStatus,
  getAllAttendance,
  getAttendanceStatistics
} = require('../controllers/adminController');
const multer = require('multer');
const path = require('path');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/faces');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'face-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: function (req, file, cb) {
    console.log('📁 Multer fileFilter - File received:', file.originalname, 'Type:', file.mimetype);
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      console.log('✅ File type accepted');
      return cb(null, true);
    }
    console.log('❌ File type rejected');
    cb(new Error('Only image files (jpeg, jpg, png) are allowed'));
  }
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('❌ Multer Error:', err.message);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 5MB'
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`
    });
  } else if (err) {
    console.error('❌ Upload Error:', err.message);
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next();
};

// All routes require admin authentication
router.use(protect);
router.use(authorize('admin'));

// User management routes
router.get('/users', getAllUsers);
router.get('/users/:userId', getUserDetails);
router.delete('/users/:userId', deleteUser);
router.put('/users/:userId/status', updateUserStatus);

// Face registration for users
router.post('/register-face/:userId', upload.single('image'), handleMulterError, registerFaceForUser);

// Attendance management routes
router.get('/attendance', getAllAttendance);
router.get('/attendance/stats', getAttendanceStatistics);

module.exports = router;
