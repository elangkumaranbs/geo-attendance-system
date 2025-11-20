import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Create axios instance
const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't auto-redirect on 401 - let components handle it
    // This allows for custom error handling like showing warnings before logout
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// Attendance API
export const attendanceAPI = {
  markAttendance: (data) => api.post('/attendance/mark', data),
  markCheckout: () => api.post('/attendance/checkout'),
  getMyRecords: (params) => api.get('/attendance/my-records', { params }),
  getTodayAttendance: () => api.get('/attendance/today'),
  getStats: (params) => api.get('/attendance/stats', { params }),
  getAllAttendance: (params) => api.get('/attendance/all', { params }),
};

// Geofence API
export const geofenceAPI = {
  validateLocation: (data) => api.post('/geofence/validate', data),
  getAll: (params) => api.get('/geofence', { params }),
  getById: (id) => api.get(`/geofence/${id}`),
  create: (data) => api.post('/geofence', data),
  update: (id, data) => api.put(`/geofence/${id}`, data),
  delete: (id) => api.delete(`/geofence/${id}`),
  toggleStatus: (id) => api.patch(`/geofence/${id}/toggle`),
};

// Face API
export const faceAPI = {
  registerFace: (formData) => 
    api.post('/face/register', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  getMyFaces: () => api.get('/face/my-faces'),
  setPrimary: (id) => api.put(`/face/${id}/set-primary`),
  deleteFace: (id) => api.delete(`/face/${id}`),
};

// Admin API
export const adminAPI = {
  getAllUsers: (params) => api.get('/admin/users', { params }),
  getUserById: (userId) => api.get(`/admin/users/${userId}`),
  updateUserStatus: (userId, status) => api.put(`/admin/users/${userId}/status`, { status }),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  registerFaceForUser: (userId, formData) => api.post(`/admin/register-face/${userId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getAllAttendance: (params) => api.get('/admin/attendance', { params }),
  getAttendanceStats: (params) => api.get('/admin/attendance/stats', { params }),
};

export default api;
