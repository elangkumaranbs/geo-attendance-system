const User = require('../models/User');
const FaceEmbedding = require('../models/FaceEmbedding');
const Attendance = require('../models/Attendance');
const { asyncHandler } = require('../middleware/errorHandler');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// @desc    Register face for any user (Admin only)
// @route   POST /api/admin/register-face/:userId
// @access  Admin
exports.registerFaceForUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  console.log('📸 Face registration request for userId:', userId);
  console.log('📁 File received:', req.file ? req.file.originalname : 'NO FILE');
  console.log('👤 Admin:', req.user?.userId);

  // Find the user
  const user = await User.findOne({ userId });
  if (!user) {
    console.log('❌ User not found:', userId);
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  console.log('✅ User found:', user.name);

  // Check if user already has max faces
  if (user.registered_faces >= 5) {
    console.log('❌ Max faces reached for user:', userId);
    return res.status(400).json({
      success: false,
      message: 'User already has maximum number of registered faces (5)'
    });
  }

  // Check if file was uploaded
  if (!req.file) {
    console.log('❌ No file uploaded');
    return res.status(400).json({
      success: false,
      message: 'Please upload a face image'
    });
  }

  console.log('📂 File path:', req.file.path);

  try {
    // Read the uploaded file
    console.log('📖 Reading file...');
    const imageBuffer = await fs.readFile(req.file.path);
    const base64Image = imageBuffer.toString('base64');
    const imageDataUrl = `data:image/jpeg;base64,${base64Image}`;

    console.log('🤖 Calling ML service...');
    // Call ML service to extract embedding
    const mlResponse = await axios.post(
      `${process.env.ML_SERVICE_URL}/extract-embedding`,
      { image: imageDataUrl },
      { timeout: 30000 }
    );

    console.log('🔍 ML Response:', mlResponse.data);

    if (!mlResponse.data.success) {
      await fs.unlink(req.file.path); // Clean up file
      console.log('❌ ML service failed:', mlResponse.data.message || mlResponse.data.detail);
      return res.status(400).json({
        success: false,
        message: mlResponse.data.message || mlResponse.data.detail || 'Failed to extract face embedding. Please ensure the image contains a clear, visible face.'
      });
    }

    const { embedding, quality_score, face_detected, metadata } = mlResponse.data.data;

    console.log('👤 Face detected:', face_detected);
    console.log('⭐ Quality score:', quality_score);
    console.log('📊 Metadata:', metadata);

    // Check if embedding is valid
    if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
      await fs.unlink(req.file.path); // Clean up file
      console.log('❌ Invalid embedding extracted');
      return res.status(400).json({
        success: false,
        message: 'Failed to extract valid face embedding. Please ensure the image contains a clear, front-facing face.'
      });
    }

    // Check if this is the first face for the user
    const existingFaces = await FaceEmbedding.countDocuments({
      userId: user.userId,
      status: 'active'
    });

    // Save face embedding
    const faceEmbedding = await FaceEmbedding.create({
      userId: user.userId,
      embedding: embedding,
      embedding_version: 'facenet_v1',
      image_url: `/uploads/faces/${req.file.filename}`,
      quality_score: quality_score,
      is_primary: existingFaces === 0, // First face is primary
      registered_by: req.user.userId, // Admin who registered
      registration_type: 'admin',
      status: 'active'
    });

    // Update user's registered_faces count
    user.registered_faces = existingFaces + 1;
    await user.save();

    console.log('✅ Face registered successfully for', user.name);

    res.status(201).json({
      success: true,
      message: 'Face registered successfully',
      data: {
        embeddingId: faceEmbedding._id,
        userId: user.userId,
        userName: user.name,
        quality_score: quality_score,
        is_primary: faceEmbedding.is_primary,
        registered_by: req.user.userId
      }
    });

  } catch (error) {
    // Clean up uploaded file on error
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(console.error);
    }

    console.error('❌ Error in registerFaceForUser:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        message: 'ML service is unavailable. Please try again later.'
      });
    }

    // Check if it's an ML service error
    if (error.response?.data?.detail) {
      return res.status(400).json({
        success: false,
        message: error.response.data.detail
      });
    }

    if (error.response?.status === 400) {
      return res.status(400).json({
        success: false,
        message: 'Face detection failed. Please upload a clear photo with a visible face.'
      });
    }

    throw error;
  }
});

// @desc    Get all users with pagination
// @route   GET /api/admin/users
// @access  Admin
exports.getAllUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const { role, status, search } = req.query;

  // Build query
  const query = {};
  if (role) query.role = role;
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { userId: { $regex: search, $options: 'i' } }
    ];
  }

  const users = await User.find(query)
    .select('-password_hash')
    .sort({ created_at: -1 })
    .limit(limit)
    .skip(skip);

  const total = await User.countDocuments(query);

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Get user details including faces and attendance
// @route   GET /api/admin/users/:userId
// @access  Admin
exports.getUserDetails = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findOne({ userId }).select('-password_hash');
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Get registered faces
  const faces = await FaceEmbedding.find({
    userId: user.userId,
    status: 'active'
  }).select('-embedding');

  // Get attendance records (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const attendanceRecords = await Attendance.find({
    userId: user.userId,
    date: { $gte: thirtyDaysAgo }
  }).sort({ date: -1 });

  // Calculate attendance stats
  const totalDays = attendanceRecords.length;
  const presentDays = attendanceRecords.filter(a => a.status === 'present').length;
  const lateDays = attendanceRecords.filter(a => a.status === 'late').length;
  const absentDays = attendanceRecords.filter(a => a.status === 'absent').length;

  res.json({
    success: true,
    data: {
      user,
      faces,
      recentAttendance: attendanceRecords,
      attendanceStats: {
        total: totalDays,
        present: presentDays,
        late: lateDays,
        absent: absentDays,
        attendance_percentage: totalDays > 0 ? ((presentDays + lateDays) / totalDays * 100).toFixed(2) : 0
      }
    }
  });
});

// @desc    Delete user
// @route   DELETE /api/admin/users/:userId
// @access  Admin
exports.deleteUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findOne({ userId });
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Don't allow deleting yourself
  if (userId === req.user.userId) {
    return res.status(400).json({
      success: false,
      message: 'You cannot delete your own account'
    });
  }

  // Delete user's face embeddings
  await FaceEmbedding.deleteMany({ userId });

  // Delete user's attendance records
  await Attendance.deleteMany({ userId });

  // Delete the user
  await User.deleteOne({ userId });

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
});

// @desc    Update user status
// @route   PUT /api/admin/users/:userId/status
// @access  Admin
exports.updateUserStatus = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { status } = req.body;

  if (!['active', 'inactive', 'suspended'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status. Must be active, inactive, or suspended'
    });
  }

  const user = await User.findOne({ userId });
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  user.status = status;
  await user.save();

  res.json({
    success: true,
    message: `User status updated to ${status}`,
    data: { user: user.toPublicJSON() }
  });
});

// @desc    Get all attendance records with filters
// @route   GET /api/admin/attendance
// @access  Admin
exports.getAllAttendance = asyncHandler(async (req, res) => {
  const { startDate, endDate, userId, status } = req.query;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 50;
  const skip = (page - 1) * limit;

  // Build query
  const query = {};
  if (startDate && endDate) {
    query.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  if (userId) query.userId = userId;
  if (status) query.status = status;

  const records = await Attendance.find(query)
    .sort({ date: -1, check_in_time: -1 })
    .limit(limit)
    .skip(skip)
    .populate('geofence_id', 'name type');

  // Fetch user names for each record
  const recordsWithUserNames = await Promise.all(records.map(async (record) => {
    const user = await User.findOne({ userId: record.userId }, 'name');
    return {
      ...record.toObject(),
      userName: user?.name || 'Unknown',
      geofence_name: record.geofence_id?.name || 'N/A'
    };
  }));

  const total = await Attendance.countDocuments(query);

  res.json({
    success: true,
    data: {
      records: recordsWithUserNames,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Get attendance statistics
// @route   GET /api/admin/attendance/stats
// @access  Admin
exports.getAttendanceStatistics = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const matchStage = {};
  if (startDate && endDate) {
    matchStage.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const stats = await Attendance.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  // Get total users
  const totalUsers = await User.countDocuments({ status: 'active' });

  // Get today's attendance
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayAttendance = await Attendance.countDocuments({
    date: today,
    status: { $in: ['present', 'late'] }
  });

  res.json({
    success: true,
    data: {
      stats: stats.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      totalUsers,
      todayAttendance,
      attendanceRate: totalUsers > 0 ? ((todayAttendance / totalUsers) * 100).toFixed(2) : 0
    }
  });
});
