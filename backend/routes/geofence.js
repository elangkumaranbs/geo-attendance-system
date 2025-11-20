const express = require('express');
const router = express.Router();
const {
  createGeofence,
  getAllGeofences,
  getGeofenceById,
  updateGeofence,
  deleteGeofence,
  validateLocation,
  getContainingGeofences,
  toggleGeofenceStatus
} = require('../controllers/geofenceController');
const { protect, authorize } = require('../middleware/auth');
const { geofenceValidation, validate, idValidation } = require('../middleware/validation');

// Public/User routes
router.post('/validate', protect, validateLocation);
router.get('/containing', protect, getContainingGeofences);
router.get('/', protect, getAllGeofences);
router.get('/:id', protect, idValidation, validate, getGeofenceById);

// Admin routes
router.post('/', protect, authorize('admin'), geofenceValidation, validate, createGeofence);
router.put('/:id', protect, authorize('admin'), idValidation, validate, updateGeofence);
router.delete('/:id', protect, authorize('admin'), idValidation, validate, deleteGeofence);
router.patch('/:id/toggle', protect, authorize('admin'), idValidation, validate, toggleGeofenceStatus);

module.exports = router;
