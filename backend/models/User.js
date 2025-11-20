const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    unique: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email'],
    index: true
  },
  password_hash: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't return password by default
  },
  role: {
    type: String,
    enum: ['student', 'employee', 'admin'],
    default: 'student',
    required: true
  },
  department: {
    type: String,
    trim: true,
    default: null
  },
  phone: {
    type: String,
    trim: true,
    default: null,
    required: false
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    default: null,
    required: false
  },
  registered_faces: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  profile_picture: {
    type: String,
    default: null
  },
  last_login: {
    type: Date,
    default: null
  },
  metadata: {
    student_id: String,
    employee_id: String,
    batch: String,
    year: Number,
    section: String
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'users'
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password_hash')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password_hash = await bcrypt.hash(this.password_hash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password_hash);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Method to get public profile
UserSchema.methods.toPublicJSON = function() {
  return {
    userId: this.userId,
    name: this.name,
    email: this.email,
    role: this.role,
    department: this.department,
    phone: this.phone,
    registered_faces: this.registered_faces,
    status: this.status,
    profile_picture: this.profile_picture,
    metadata: this.metadata,
    created_at: this.created_at,
    last_login: this.last_login
  };
};

// Indexes for performance
UserSchema.index({ email: 1, status: 1 });
UserSchema.index({ userId: 1, status: 1 });
UserSchema.index({ role: 1, status: 1 });

module.exports = mongoose.model('User', UserSchema);
