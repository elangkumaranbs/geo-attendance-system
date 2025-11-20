const Geofence = require('../models/Geofence');
const { asyncHandler } = require('../middleware/errorHandler');
const { validateGeofenceAccess, findContainingGeofences } = require('../utils/geofence');

// @desc    Create new geofence
// @route   POST /api/geofence
// @access  Private/Admin
exports.createGeofence = asyncHandler(async (req, res) => {
  const geofenceData = {
    ...req.body,
    created_by: req.user.userId
  };

  const geofence = await Geofence.create(geofenceData);

  res.status(201).json({
    success: true,
    message: 'Geofence created successfully',
    data: {
      geofence: geofence
    }
  });
});

// @desc    Get all geofences
// @route   GET /api/geofence
// @access  Private
exports.getAllGeofences = asyncHandler(async (req, res) => {
  const { type, active } = req.query;

  const query = {};
  if (type) query.type = type;
  if (active !== undefined) query.active = active === 'true';

  const geofences = await Geofence.find(query).sort({ created_at: -1 });

  res.status(200).json({
    success: true,
    data: {
      count: geofences.length,
      geofences: geofences
    }
  });
});

// @desc    Get geofence by ID
// @route   GET /api/geofence/:id
// @access  Private
exports.getGeofenceById = asyncHandler(async (req, res) => {
  const geofence = await Geofence.findById(req.params.id);

  if (!geofence) {
    return res.status(404).json({
      success: false,
      message: 'Geofence not found'
    });
  }

  res.status(200).json({
    success: true,
    data: {
      geofence: geofence
    }
  });
});

// @desc    Update geofence
// @route   PUT /api/geofence/:id
// @access  Private/Admin
exports.updateGeofence = asyncHandler(async (req, res) => {
  const geofence = await Geofence.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!geofence) {
    return res.status(404).json({
      success: false,
      message: 'Geofence not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Geofence updated successfully',
    data: {
      geofence: geofence
    }
  });
});

// @desc    Delete geofence
// @route   DELETE /api/geofence/:id
// @access  Private/Admin
exports.deleteGeofence = asyncHandler(async (req, res) => {
  const geofence = await Geofence.findByIdAndDelete(req.params.id);

  if (!geofence) {
    return res.status(404).json({
      success: false,
      message: 'Geofence not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Geofence deleted successfully'
  });
});

// @desc    Validate location against geofences
// @route   POST /api/geofence/validate
// @access  Private
exports.validateLocation = asyncHandler(async (req, res) => {
  const { latitude, longitude } = req.body;

  if (!latitude || !longitude) {
    return res.status(400).json({
      success: false,
      message: 'Latitude and longitude are required'
    });
  }

  // Get all active geofences
  const geofences = await Geofence.find({ active: true });

  if (geofences.length === 0) {
    return res.status(200).json({
      success: true,
      data: {
        valid: false,
        message: 'No active geofences found',
        geofences: []
      }
    });
  }

  // Check each geofence
  const results = [];
  let validGeofence = null;

  for (const geofence of geofences) {
    const validation = validateGeofenceAccess(
      geofence,
      latitude,
      longitude,
      req.user.role
    );

    results.push({
      geofence: {
        id: geofence._id,
        name: geofence.name,
        type: geofence.type
      },
      validation: validation
    });

    if (validation.allowed && !validGeofence) {
      validGeofence = geofence;
    }
  }

  // Sort by distance
  results.sort((a, b) => a.validation.distance - b.validation.distance);

  res.status(200).json({
    success: true,
    data: {
      valid: !!validGeofence,
      validGeofence: validGeofence ? {
        id: validGeofence._id,
        name: validGeofence.name,
        type: validGeofence.type
      } : null,
      allResults: results
    }
  });
});

// @desc    Get geofences containing a point
// @route   GET /api/geofence/containing
// @access  Private
exports.getContainingGeofences = asyncHandler(async (req, res) => {
  const { latitude, longitude } = req.query;

  if (!latitude || !longitude) {
    return res.status(400).json({
      success: false,
      message: 'Latitude and longitude are required'
    });
  }

  const lat = parseFloat(latitude);
  const lon = parseFloat(longitude);

  const geofences = await Geofence.findContainingPoint(lat, lon);

  res.status(200).json({
    success: true,
    data: {
      count: geofences.length,
      geofences: geofences
    }
  });
});

// @desc    Toggle geofence active status
// @route   PATCH /api/geofence/:id/toggle
// @access  Private/Admin
exports.toggleGeofenceStatus = asyncHandler(async (req, res) => {
  const geofence = await Geofence.findById(req.params.id);

  if (!geofence) {
    return res.status(404).json({
      success: false,
      message: 'Geofence not found'
    });
  }

  geofence.active = !geofence.active;
  await geofence.save();

  res.status(200).json({
    success: true,
    message: `Geofence ${geofence.active ? 'activated' : 'deactivated'} successfully`,
    data: {
      geofence: geofence
    }
  });
});
