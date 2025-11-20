const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    index: true,
    ref: 'User'
  },
  date: {
    type: Date,
    required: true,
    index: true,
    // Store only date part (no time) for easier querying
    set: function(val) {
      const date = new Date(val);
      date.setHours(0, 0, 0, 0);
      return date;
    }
  },
  check_in_time: {
    type: Date,
    required: true,
    default: Date.now
  },
  check_out_time: {
    type: Date,
    default: null
  },
  location: {
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180
    },
    accuracy: {
      type: Number,
      default: null,
      min: 0
    }
  },
  face_match_score: {
    type: Number,
    required: true,
    min: 0,
    max: 1,
    default: 0
  },
  geofence_name: {
    type: String,
    required: true,
    trim: true
  },
  geofence_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Geofence',
    default: null
  },
  status: {
    type: String,
    enum: ['present', 'late', 'absent', 'excused', 'pending'],
    default: 'present',
    required: true
  },
  verified_by: {
    type: String,
    enum: ['face', 'manual', 'auto', 'qr'],
    default: 'face',
    required: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500,
    default: null
  },
  approved_by: {
    type: String,
    ref: 'User',
    default: null
  },
  device_info: {
    user_agent: String,
    ip_address: String,
    device_type: String
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'attendance'
});

// Compound indexes for efficient queries
AttendanceSchema.index({ userId: 1, date: 1 }, { unique: true }); // One attendance per user per day
AttendanceSchema.index({ date: 1, status: 1 });
AttendanceSchema.index({ userId: 1, created_at: -1 });
AttendanceSchema.index({ geofence_id: 1, date: 1 });

// Calculate duration between check-in and check-out
AttendanceSchema.virtual('duration').get(function() {
  if (this.check_out_time && this.check_in_time) {
    return Math.floor((this.check_out_time - this.check_in_time) / 1000 / 60); // Duration in minutes
  }
  return null;
});

// Static method to get attendance for a specific date range
AttendanceSchema.statics.getAttendanceByDateRange = function(userId, startDate, endDate) {
  return this.find({
    userId,
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  }).sort({ date: -1 });
};

// Static method to get today's attendance
AttendanceSchema.statics.getTodayAttendance = function(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return this.findOne({
    userId,
    date: today
  });
};

// Static method to mark check-out
AttendanceSchema.statics.markCheckOut = async function(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return this.findOneAndUpdate(
    {
      userId,
      date: today,
      check_out_time: null
    },
    {
      check_out_time: new Date()
    },
    { new: true }
  );
};

// Ensure virtual fields are included in JSON
AttendanceSchema.set('toJSON', { virtuals: true });
AttendanceSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);
