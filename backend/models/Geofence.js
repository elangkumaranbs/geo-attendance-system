const mongoose = require('mongoose');

const GeofenceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Geofence name is required'],
    unique: true,
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
    default: null
  },
  type: {
    type: String,
    enum: ['campus', 'building', 'classroom', 'lab', 'office'],
    default: 'campus',
    required: true
  },
  center: {
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
    }
  },
  radius: {
    type: Number,
    required: true,
    min: 10,
    max: 5000, // Max 5km radius
    default: 100 // Default 100 meters
  },
  active: {
    type: Boolean,
    default: true,
    required: true
  },
  allowed_times: {
    enabled: {
      type: Boolean,
      default: false
    },
    start: {
      type: String,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format'],
      default: '00:00'
    },
    end: {
      type: String,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format'],
      default: '23:59'
    }
  },
  allowed_days: {
    enabled: {
      type: Boolean,
      default: false
    },
    days: {
      type: [String],
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      default: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    }
  },
  allowed_roles: {
    type: [String],
    enum: ['student', 'employee', 'admin'],
    default: ['student', 'employee']
  },
  wifi_ssids: {
    enabled: {
      type: Boolean,
      default: false
    },
    ssids: {
      type: [String],
      default: []
    }
  },
  color: {
    type: String,
    match: [/^#[0-9A-F]{6}$/i, 'Color must be a valid hex code'],
    default: '#3B82F6'
  },
  created_by: {
    type: String,
    ref: 'User',
    required: true
  },
  metadata: {
    building_code: String,
    floor: Number,
    capacity: Number,
    department: String
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'geofences'
});

// Indexes
GeofenceSchema.index({ name: 1 });
GeofenceSchema.index({ type: 1, active: 1 });
GeofenceSchema.index({ 'center.latitude': 1, 'center.longitude': 1 });

// Method to check if a point is within this geofence
GeofenceSchema.methods.isPointInside = function(latitude, longitude) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = this.center.latitude * Math.PI / 180;
  const φ2 = latitude * Math.PI / 180;
  const Δφ = (latitude - this.center.latitude) * Math.PI / 180;
  const Δλ = (longitude - this.center.longitude) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  const distance = R * c; // Distance in meters
  
  return distance <= this.radius;
};

// Method to check if current time is within allowed times
GeofenceSchema.methods.isTimeAllowed = function() {
  if (!this.allowed_times.enabled) {
    return true;
  }

  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  return currentTime >= this.allowed_times.start && currentTime <= this.allowed_times.end;
};

// Method to check if current day is allowed
GeofenceSchema.methods.isDayAllowed = function() {
  if (!this.allowed_days.enabled) {
    return true;
  }

  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = days[new Date().getDay()];
  
  return this.allowed_days.days.includes(today);
};

// Method to check if role is allowed
GeofenceSchema.methods.isRoleAllowed = function(userRole) {
  return this.allowed_roles.includes(userRole);
};

// Method to validate all constraints
GeofenceSchema.methods.validateAccess = function(latitude, longitude, userRole) {
  const result = {
    allowed: false,
    inside: false,
    timeAllowed: false,
    dayAllowed: false,
    roleAllowed: false,
    distance: null,
    message: ''
  };

  // Check if point is inside geofence
  result.inside = this.isPointInside(latitude, longitude);
  
  // Calculate distance for debugging
  const R = 6371e3;
  const φ1 = this.center.latitude * Math.PI / 180;
  const φ2 = latitude * Math.PI / 180;
  const Δφ = (latitude - this.center.latitude) * Math.PI / 180;
  const Δλ = (longitude - this.center.longitude) * Math.PI / 180;
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  result.distance = Math.round(R * c);

  // Check time
  result.timeAllowed = this.isTimeAllowed();
  
  // Check day
  result.dayAllowed = this.isDayAllowed();
  
  // Check role
  result.roleAllowed = this.isRoleAllowed(userRole);

  // Determine overall access
  result.allowed = result.inside && result.timeAllowed && result.dayAllowed && result.roleAllowed;

  // Generate message
  if (!result.inside) {
    result.message = `You are ${result.distance}m away from ${this.name}. Required: within ${this.radius}m`;
  } else if (!result.timeAllowed) {
    result.message = `Access to ${this.name} is not allowed at this time`;
  } else if (!result.dayAllowed) {
    result.message = `Access to ${this.name} is not allowed today`;
  } else if (!result.roleAllowed) {
    result.message = `Your role does not have access to ${this.name}`;
  } else {
    result.message = `Access granted to ${this.name}`;
  }

  return result;
};

// Static method to find all geofences containing a point
GeofenceSchema.statics.findContainingPoint = function(latitude, longitude) {
  return this.find({ active: true }).then(geofences => {
    return geofences.filter(geofence => geofence.isPointInside(latitude, longitude));
  });
};

module.exports = mongoose.model('Geofence', GeofenceSchema);
