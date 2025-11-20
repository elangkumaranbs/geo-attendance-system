/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in meters
 */
exports.calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  const distance = R * c;
  return distance;
};

/**
 * Check if a point is within a circular geofence
 * @param {number} pointLat - Latitude of the point to check
 * @param {number} pointLon - Longitude of the point to check
 * @param {number} centerLat - Latitude of geofence center
 * @param {number} centerLon - Longitude of geofence center
 * @param {number} radius - Radius of geofence in meters
 * @returns {object} Result object with inside boolean and distance
 */
exports.isPointInGeofence = (pointLat, pointLon, centerLat, centerLon, radius) => {
  const distance = this.calculateDistance(pointLat, pointLon, centerLat, centerLon);
  
  return {
    inside: distance <= radius,
    distance: Math.round(distance),
    radius: radius
  };
};

/**
 * Validate GPS accuracy
 * @param {number} accuracy - GPS accuracy in meters
 * @param {number} threshold - Acceptable accuracy threshold
 * @returns {object} Validation result
 */
exports.validateAccuracy = (accuracy, threshold = 50) => {
  const isValid = accuracy <= threshold;
  
  return {
    valid: isValid,
    accuracy: accuracy,
    threshold: threshold,
    message: isValid 
      ? 'GPS accuracy is acceptable' 
      : `GPS accuracy (${accuracy}m) exceeds threshold (${threshold}m)`
  };
};

/**
 * Find all geofences containing a point
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {Array} geofences - Array of geofence objects
 * @returns {Array} Array of geofences containing the point
 */
exports.findContainingGeofences = (lat, lon, geofences) => {
  return geofences.filter(geofence => {
    const result = this.isPointInGeofence(
      lat, lon,
      geofence.center.latitude,
      geofence.center.longitude,
      geofence.radius
    );
    return result.inside;
  });
};

/**
 * Check if current time is within allowed time range
 * @param {string} startTime - Start time in HH:MM format
 * @param {string} endTime - End time in HH:MM format
 * @returns {boolean} True if current time is within range
 */
exports.isTimeInRange = (startTime, endTime) => {
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  return currentTime >= startTime && currentTime <= endTime;
};

/**
 * Check if current day is in allowed days
 * @param {Array} allowedDays - Array of allowed day names
 * @returns {boolean} True if today is allowed
 */
exports.isDayAllowed = (allowedDays) => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = days[new Date().getDay()];
  
  return allowedDays.includes(today);
};

/**
 * Get the nearest geofence to a point
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {Array} geofences - Array of geofence objects
 * @returns {object} Nearest geofence with distance
 */
exports.getNearestGeofence = (lat, lon, geofences) => {
  if (!geofences || geofences.length === 0) {
    return null;
  }

  let nearest = null;
  let minDistance = Infinity;

  geofences.forEach(geofence => {
    const distance = this.calculateDistance(
      lat, lon,
      geofence.center.latitude,
      geofence.center.longitude
    );

    if (distance < minDistance) {
      minDistance = distance;
      nearest = geofence;
    }
  });

  return {
    geofence: nearest,
    distance: Math.round(minDistance)
  };
};

/**
 * Validate geofence access with all constraints
 * @param {object} geofence - Geofence object
 * @param {number} lat - User latitude
 * @param {number} lon - User longitude
 * @param {string} userRole - User role
 * @returns {object} Validation result with detailed information
 */
exports.validateGeofenceAccess = (geofence, lat, lon, userRole) => {
  const result = {
    allowed: false,
    inside: false,
    timeAllowed: true,
    dayAllowed: true,
    roleAllowed: true,
    distance: null,
    reasons: []
  };

  // Check if point is inside
  const locationCheck = this.isPointInGeofence(
    lat, lon,
    geofence.center.latitude,
    geofence.center.longitude,
    geofence.radius
  );
  
  result.inside = locationCheck.inside;
  result.distance = locationCheck.distance;

  if (!result.inside) {
    result.reasons.push(`Outside geofence (${locationCheck.distance}m away, need to be within ${geofence.radius}m)`);
  }

  // Check time constraints
  if (geofence.allowed_times?.enabled) {
    result.timeAllowed = this.isTimeInRange(
      geofence.allowed_times.start,
      geofence.allowed_times.end
    );
    
    if (!result.timeAllowed) {
      result.reasons.push(`Outside allowed time range (${geofence.allowed_times.start} - ${geofence.allowed_times.end})`);
    }
  }

  // Check day constraints
  if (geofence.allowed_days?.enabled) {
    result.dayAllowed = this.isDayAllowed(geofence.allowed_days.days);
    
    if (!result.dayAllowed) {
      result.reasons.push('Today is not an allowed day');
    }
  }

  // Check role constraints
  if (geofence.allowed_roles && !geofence.allowed_roles.includes(userRole)) {
    result.roleAllowed = false;
    result.reasons.push(`Role '${userRole}' is not authorized`);
  }

  // Overall access decision
  result.allowed = result.inside && result.timeAllowed && result.dayAllowed && result.roleAllowed;

  return result;
};
