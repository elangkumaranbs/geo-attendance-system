const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  getAllUsers,
  getUserById,
  updateUserStatus,
  deleteUser
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');
const { registerValidation, loginValidation, validate } = require('../middleware/validation');

// Public routes
router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);

// Protected routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

// Admin routes
router.get('/users', protect, authorize('admin'), getAllUsers);
router.get('/users/:userId', protect, authorize('admin'), getUserById);
router.put('/users/:userId/status', protect, authorize('admin'), updateUserStatus);
router.delete('/users/:userId', protect, authorize('admin'), deleteUser);

module.exports = router;
