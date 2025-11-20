// Email validation
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation (min 6 characters)
export const isValidPassword = (password) => {
  return password && password.length >= 6;
};

// Phone validation (10-15 digits)
export const isValidPhone = (phone) => {
  const phoneRegex = /^[0-9]{10,15}$/;
  return phoneRegex.test(phone);
};

// User ID validation
export const isValidUserId = (userId) => {
  return userId && userId.length >= 3 && userId.length <= 50;
};

// Form validation helper
export const validateField = (name, value, rules = {}) => {
  const errors = [];

  if (rules.required && !value) {
    errors.push(`${name} is required`);
  }

  if (rules.email && value && !isValidEmail(value)) {
    errors.push('Invalid email format');
  }

  if (rules.password && value && !isValidPassword(value)) {
    errors.push('Password must be at least 6 characters');
  }

  if (rules.phone && value && !isValidPhone(value)) {
    errors.push('Invalid phone number');
  }

  if (rules.minLength && value && value.length < rules.minLength) {
    errors.push(`${name} must be at least ${rules.minLength} characters`);
  }

  if (rules.maxLength && value && value.length > rules.maxLength) {
    errors.push(`${name} cannot exceed ${rules.maxLength} characters`);
  }

  return errors;
};

// Validate registration form
export const validateRegistrationForm = (formData) => {
  const errors = {};

  if (!formData.name || formData.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }

  if (!formData.email || !isValidEmail(formData.email)) {
    errors.email = 'Invalid email address';
  }

  if (!formData.userId || !isValidUserId(formData.userId)) {
    errors.userId = 'User ID must be 3-50 characters';
  }

  if (!formData.password || !isValidPassword(formData.password)) {
    errors.password = 'Password must be at least 6 characters';
  }

  if (formData.phone && !isValidPhone(formData.phone)) {
    errors.phone = 'Invalid phone number (10-15 digits)';
  }

  return errors;
};

// Validate login form
export const validateLoginForm = (formData) => {
  const errors = {};

  if (!formData.email || !isValidEmail(formData.email)) {
    errors.email = 'Invalid email address';
  }

  if (!formData.password) {
    errors.password = 'Password is required';
  }

  return errors;
};
