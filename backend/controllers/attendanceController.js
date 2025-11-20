const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Geofence = require('../models/Geofence');
const FaceEmbedding = require('../models/FaceEmbedding');
const { asyncHandler } = require('../middleware/errorHandler');
const { validateGeofenceAccess } = require('../utils/geofence');
const { getTodayStart, getDateRange, getLastNDays } = require('../utils/dateUtils');
const axios = require('axios');

// @desc    Mark attendance
// @route   POST /api/attendance/mark
// @access  Private
exports.markAttendance = asyncHandler(async (req, res) => {
  const { location, faceImage, deviceInfo } = req.body;
  const userId = req.user.userId;

  // Validate location
  if (!location || !location.latitude || !location.longitude) {
    return res.status(400).json({
      success: false,
      message: 'Location data is required'
    });
  }

  // GPS accuracy check disabled for development
  // if (location.accuracy && location.accuracy > 50) {
  //   return res.status(400).json({
  //     success: false,
  //     message: `GPS accuracy too low (${location.accuracy}m). Please ensure good GPS signal.`
  //   });
  // }

  // Check if attendance already marked today
  const existingAttendance = await Attendance.getTodayAttendance(userId);
  
  if (existingAttendance) {
    return res.status(400).json({
      success: false,
      message: 'Attendance already marked for today',
      data: {
        attendance: existingAttendance
      }
    });
  }

  // Get all active geofences
  const geofences = await Geofence.find({ active: true });

  if (geofences.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No active geofences found'
    });
  }

  // Find geofences containing the user's location
  let validGeofence = null;
  let geofenceValidation = null;

  for (const geofence of geofences) {
    const validation = validateGeofenceAccess(
      geofence,
      location.latitude,
      location.longitude,
      req.user.role
    );

    if (validation.allowed) {
      validGeofence = geofence;
      geofenceValidation = validation;
      break;
    }
  }

  if (!validGeofence) {
    // Find nearest geofence for better error message
    const nearest = geofences.reduce((prev, curr) => {
      const prevDist = Math.abs(prev.center.latitude - location.latitude) + 
                       Math.abs(prev.center.longitude - location.longitude);
      const currDist = Math.abs(curr.center.latitude - location.latitude) + 
                       Math.abs(curr.center.longitude - location.longitude);
      return currDist < prevDist ? curr : prev;
    });

    const nearestValidation = validateGeofenceAccess(
      nearest,
      location.latitude,
      location.longitude,
      req.user.role
    );

    return res.status(400).json({
      success: false,
      message: 'You are not within any valid geofence area',
      data: {
        nearestGeofence: nearest.name,
        distance: nearestValidation.distance,
        reasons: nearestValidation.reasons
      }
    });
  }

  // Verify face if image provided (using CNN-based FaceNet model)
  let faceMatchScore = 0;
  let verifiedBy = 'auto';
  let faceVerificationDetails = null;

  if (faceImage) {
    try {
      console.log(`🔍 Starting CNN-based face verification for user: ${userId}`);
      
      // Call ML service for face verification
      const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
      const response = await axios.post(`${mlServiceUrl}/verify-face`, {
        userId: userId,
        image: faceImage
      }, {
        timeout: 8000 // Reduced timeout to 8 seconds for faster response
      });

      console.log('✅ ML Service Response:', JSON.stringify(response.data, null, 2));

      if (response.data.success) {
        const verificationData = response.data.data;
        faceMatchScore = verificationData.similarity;
        verifiedBy = 'face';
        faceVerificationDetails = {
          similarity: verificationData.similarity,
          avg_similarity: verificationData.avg_similarity,
          patterns_compared: verificationData.patterns_compared,
          match: verificationData.match
        };

        console.log(`📊 Face Match Score: ${(faceMatchScore * 100).toFixed(2)}%`);
        console.log(`📊 Avg Similarity: ${(verificationData.avg_similarity * 100).toFixed(2)}%`);
        console.log(`📊 Patterns Compared: ${verificationData.patterns_compared}`);
        
        // Check if similarity meets threshold
        const threshold = parseFloat(process.env.FACE_SIMILARITY_THRESHOLD) || 0.70;
        
        if (!verificationData.match || faceMatchScore < threshold) {
          console.log(`❌ Face verification failed: ${(faceMatchScore * 100).toFixed(2)}% < ${(threshold * 100)}%`);
          return res.status(401).json({
            success: false,
            message: `Face verification failed. Similarity score (${(faceMatchScore * 100).toFixed(1)}%) is below threshold (${(threshold * 100)}%).`,
            data: {
              similarity: faceMatchScore,
              threshold: threshold,
              patterns_compared: verificationData.patterns_compared
            }
          });
        }
        
        console.log(`✅ Face verification successful: ${(faceMatchScore * 100).toFixed(2)}%`);
      }
    } catch (error) {
      console.error('❌ Face verification error:', error.response?.data || error.message);
      
      // If ML service returns specific error, fail the attendance
      if (error.response?.status === 404) {
        return res.status(400).json({
          success: false,
          message: 'No face registered for your account. Please register your face first.'
        });
      }
      
      if (error.response?.status === 400) {
        return res.status(400).json({
          success: false,
          message: error.response.data.detail || 'Face verification failed. Please try again with better lighting.'
        });
      }
      
      // For other errors, fail the request for security
      return res.status(503).json({
        success: false,
        message: 'Face verification service temporarily unavailable. Please try again.'
      });
    }
  } else {
    return res.status(400).json({
      success: false,
      message: 'Face image is required for attendance verification'
    });
  }

  // Determine attendance status based on time
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const lateThreshold = '09:30'; // Consider late after 9:30 AM
  
  const status = currentTime > lateThreshold ? 'late' : 'present';

  // Create attendance record
  const attendance = await Attendance.create({
    userId: userId,
    date: getTodayStart(),
    check_in_time: new Date(),
    location: {
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy || null
    },
    face_match_score: faceMatchScore,
    geofence_name: validGeofence.name,
    geofence_id: validGeofence._id,
    status: status,
    verified_by: verifiedBy,
    device_info: deviceInfo || {}
  });

  res.status(201).json({
    success: true,
    message: `Attendance marked successfully as ${status}`,
    data: {
      attendance: attendance,
      geofence: {
        name: validGeofence.name,
        type: validGeofence.type
      },
      faceVerification: {
        verified: verifiedBy === 'face',
        score: faceMatchScore
      }
    }
  });
});

// @desc    Mark checkout
// @route   POST /api/attendance/checkout
// @access  Private
exports.markCheckout = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  const attendance = await Attendance.markCheckOut(userId);

  if (!attendance) {
    return res.status(404).json({
      success: false,
      message: 'No active attendance found for today or already checked out'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Checkout marked successfully',
    data: {
      attendance: attendance
    }
  });
});

// @desc    Get my attendance records
// @route   GET /api/attendance/my-records
// @access  Private
exports.getMyAttendance = asyncHandler(async (req, res) => {
  const { startDate, endDate, page = 1, limit = 20 } = req.query;
  const userId = req.user.userId;

  let query = { userId };

  if (startDate && endDate) {
    query.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  } else {
    // Default to last 30 days
    const { start, end } = getLastNDays(30);
    query.date = { $gte: start, $lte: end };
  }

  const attendance = await Attendance.find(query)
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ date: -1 });

  const count = await Attendance.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      attendance: attendance,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    }
  });
});

// @desc    Get today's attendance status
// @route   GET /api/attendance/today
// @access  Private
exports.getTodayAttendance = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const attendance = await Attendance.getTodayAttendance(userId);

  res.status(200).json({
    success: true,
    data: {
      marked: !!attendance,
      attendance: attendance || null
    }
  });
});

// @desc    Get all attendance (admin only)
// @route   GET /api/attendance/all
// @access  Private/Admin
exports.getAllAttendance = asyncHandler(async (req, res) => {
  const { userId, date, status, geofenceId, page = 1, limit = 50 } = req.query;

  const query = {};

  if (userId) query.userId = userId;
  if (status) query.status = status;
  if (geofenceId) query.geofence_id = geofenceId;
  
  if (date) {
    const { start, end } = getDateRange(new Date(date));
    query.date = { $gte: start, $lte: end };
  }

  const attendance = await Attendance.find(query)
    .populate('userId', 'name email role')
    .populate('geofence_id', 'name type')
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ date: -1, check_in_time: -1 });

  const count = await Attendance.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      attendance: attendance,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    }
  });
});

// @desc    Get attendance statistics
// @route   GET /api/attendance/stats
// @access  Private
exports.getAttendanceStats = asyncHandler(async (req, res) => {
  const userId = req.user.role === 'admin' ? req.query.userId : req.user.userId;
  const { days = 30 } = req.query;

  const { start, end } = getLastNDays(parseInt(days));

  const stats = await Attendance.aggregate([
    {
      $match: {
        ...(userId && { userId: userId }),
        date: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const totalDays = parseInt(days);
  const present = stats.find(s => s._id === 'present')?.count || 0;
  const late = stats.find(s => s._id === 'late')?.count || 0;
  const absent = totalDays - (present + late);
  const percentage = totalDays > 0 ? ((present + late) / totalDays * 100).toFixed(2) : 0;

  res.status(200).json({
    success: true,
    data: {
      period: {
        days: totalDays,
        startDate: start,
        endDate: end
      },
      stats: {
        present: present,
        late: late,
        absent: absent,
        total: present + late,
        percentage: parseFloat(percentage)
      }
    }
  });
});
