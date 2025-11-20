const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res) => {
  console.log('\n🔵 ===== REGISTER REQUEST START ===== 🔵');
  const { userId, name, email, password, role, department, phone, gender, metadata } = req.body;

  console.log('📝 Register request body:', JSON.stringify(req.body, null, 2));

  // Check if user already exists
  const existingUser = await User.findOne({ $or: [{ email }, { userId }] });
  
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: existingUser.email === email 
        ? 'Email already registered' 
        : 'User ID already exists'
    });
  }

  // Create user - filter out empty strings
  const userData = {
    userId,
    name,
    email,
    password_hash: password, // Will be hashed by pre-save hook
    role: role || 'student',
  };

  // Only add optional fields if they have values
  if (department && department.trim() !== '') userData.department = department;
  if (phone && phone.trim() !== '') userData.phone = phone;
  if (gender && gender.trim() !== '') userData.gender = gender;
  if (metadata) userData.metadata = metadata;

  console.log('📝 User data to create:', userData);

  try {
    // Create user
    const user = await User.create(userData);
    console.log('✅ User created successfully:', user.userId);
  } catch (error) {
    console.error('❌ User creation error:', error.message);
    console.error('❌ Validation errors:', error.errors);
    return res.status(400).json({
      success: false,
      message: 'Validation failed: ' + error.message,
      errors: error.errors
    });
  }

  const user = await User.findOne({ userId });

  // Generate token
  const token = generateToken(user.userId, user.role);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: user.toPublicJSON(),
      token
    }
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check if user exists and get password
  const user = await User.findOne({ email, status: 'active' }).select('+password_hash');

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  // Check password
  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  // Update last login
  user.last_login = new Date();
  await user.save();

  // Generate token
  const token = generateToken(user.userId, user.role);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: user.toPublicJSON(),
      token
    }
  });
});

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
exports.getProfile = asyncHandler(async (req, res) => {
  const user = await User.findOne({ userId: req.user.userId });

  res.status(200).json({
    success: true,
    data: {
      user: user.toPublicJSON()
    }
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = ['name', 'phone', 'department', 'metadata', 'profile_picture'];
  const updates = {};

  // Filter only allowed fields
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  const user = await User.findOneAndUpdate(
    { userId: req.user.userId },
    updates,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: user.toPublicJSON()
    }
  });
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Please provide current and new password'
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'New password must be at least 6 characters'
    });
  }

  // Get user with password
  const user = await User.findOne({ userId: req.user.userId }).select('+password_hash');

  // Check current password
  const isMatch = await user.comparePassword(currentPassword);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  // Update password
  user.password_hash = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password changed successfully'
  });
});

// @desc    Get all users (admin only)
// @route   GET /api/auth/users
// @access  Private/Admin
exports.getAllUsers = asyncHandler(async (req, res) => {
  const { role, status, search, page = 1, limit = 20 } = req.query;

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
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ created_at: -1 });

  const count = await User.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      users: users.map(user => user.toPublicJSON()),
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    }
  });
});

// @desc    Get user by ID (admin only)
// @route   GET /api/auth/users/:userId
// @access  Private/Admin
exports.getUserById = asyncHandler(async (req, res) => {
  const user = await User.findOne({ userId: req.params.userId });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.status(200).json({
    success: true,
    data: {
      user: user.toPublicJSON()
    }
  });
});

// @desc    Update user status (admin only)
// @route   PUT /api/auth/users/:userId/status
// @access  Private/Admin
exports.updateUserStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!['active', 'inactive', 'suspended'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status value'
    });
  }

  const user = await User.findOneAndUpdate(
    { userId: req.params.userId },
    { status },
    { new: true }
  );

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'User status updated successfully',
    data: {
      user: user.toPublicJSON()
    }
  });
});

// @desc    Delete user (admin only)
// @route   DELETE /api/auth/users/:userId
// @access  Private/Admin
exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findOneAndUpdate(
    { userId: req.params.userId },
    { status: 'inactive' },
    { new: true }
  );

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'User deactivated successfully'
  });
});
