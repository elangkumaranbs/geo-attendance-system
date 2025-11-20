module.exports = {
  // Server
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  
  // Face Recognition
  FACE_SIMILARITY_THRESHOLD: parseFloat(process.env.FACE_SIMILARITY_THRESHOLD) || 0.85,
  MAX_FACES_PER_USER: parseInt(process.env.MAX_FACES_PER_USER) || 5,
  
  // Geofence
  DEFAULT_GEOFENCE_RADIUS: parseInt(process.env.DEFAULT_GEOFENCE_RADIUS) || 100,
  GPS_ACCURACY_THRESHOLD: parseInt(process.env.GPS_ACCURACY_THRESHOLD) || 50,
  
  // File Upload
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
  
  // ML Service
  ML_SERVICE_URL: process.env.ML_SERVICE_URL || 'http://localhost:8000',
  
  // User Roles
  ROLES: {
    ADMIN: 'admin',
    EMPLOYEE: 'employee',
    STUDENT: 'student'
  },
  
  // Attendance Status
  ATTENDANCE_STATUS: {
    PRESENT: 'present',
    LATE: 'late',
    ABSENT: 'absent',
    EXCUSED: 'excused'
  },
  
  // Verification Types
  VERIFICATION_TYPES: {
    FACE: 'face',
    MANUAL: 'manual',
    AUTO: 'auto'
  },
  
  // Geofence Types
  GEOFENCE_TYPES: {
    CAMPUS: 'campus',
    BUILDING: 'building',
    CLASSROOM: 'classroom'
  }
};
