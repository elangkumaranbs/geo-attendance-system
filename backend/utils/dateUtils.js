/**
 * Get start and end of day for a given date
 * @param {Date} date - Input date
 * @returns {object} Start and end timestamps
 */
exports.getDateRange = (date = new Date()) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
};

/**
 * Get today's date at midnight
 * @returns {Date} Today's date at 00:00:00
 */
exports.getTodayStart = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

/**
 * Check if a date is today
 * @param {Date} date - Date to check
 * @returns {boolean} True if date is today
 */
exports.isToday = (date) => {
  const today = new Date();
  const checkDate = new Date(date);
  
  return today.getFullYear() === checkDate.getFullYear() &&
         today.getMonth() === checkDate.getMonth() &&
         today.getDate() === checkDate.getDate();
};

/**
 * Format date to YYYY-MM-DD
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
exports.formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Format time to HH:MM:SS
 * @param {Date} date - Date to format
 * @returns {string} Formatted time string
 */
exports.formatTime = (date) => {
  const d = new Date(date);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  return `${hours}:${minutes}:${seconds}`;
};

/**
 * Get date range for last N days
 * @param {number} days - Number of days
 * @returns {object} Start and end dates
 */
exports.getLastNDays = (days) => {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  
  const start = new Date();
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);
  
  return { start, end };
};

/**
 * Get current month date range
 * @returns {object} Start and end of current month
 */
exports.getCurrentMonth = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  
  return { start, end };
};

/**
 * Calculate duration between two times in minutes
 * @param {Date} start - Start time
 * @param {Date} end - End time
 * @returns {number} Duration in minutes
 */
exports.getDuration = (start, end) => {
  const diff = new Date(end) - new Date(start);
  return Math.floor(diff / 1000 / 60);
};

/**
 * Check if time is within a range
 * @param {Date} time - Time to check
 * @param {string} startTime - Start time (HH:MM)
 * @param {string} endTime - End time (HH:MM)
 * @returns {boolean} True if within range
 */
exports.isTimeWithinRange = (time, startTime, endTime) => {
  const t = new Date(time);
  const timeStr = `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
  
  return timeStr >= startTime && timeStr <= endTime;
};

/**
 * Get day name from date
 * @param {Date} date - Input date
 * @returns {string} Day name in lowercase
 */
exports.getDayName = (date = new Date()) => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[new Date(date).getDay()];
};

/**
 * Check if date is a weekday
 * @param {Date} date - Date to check
 * @returns {boolean} True if weekday (Monday-Friday)
 */
exports.isWeekday = (date = new Date()) => {
  const day = new Date(date).getDay();
  return day >= 1 && day <= 5;
};
