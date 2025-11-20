import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import WebcamCapture from '../../components/WebcamCapture';
import { adminAPI, faceAPI } from '../../utils/api';
import toast from 'react-hot-toast';

export default function FaceManagement() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token || user.role !== 'admin') {
      toast.error('Access denied. Admin only.');
      router.push('/login');
      return;
    }

    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllUsers();
      const usersList = response.data.data?.users || response.data.users || [];
      setUsers(usersList);
    } catch (error) {
      toast.error('Failed to fetch users');
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFaceCapture = (imageData) => {
    setCapturedImage(imageData);
  };

  const handleRegisterFace = async () => {
    if (!selectedUser || !capturedImage) {
      toast.error('Please select a user and capture a face image');
      return;
    }

    setRegistering(true);
    try {
      // Convert base64 to blob
      const base64Data = capturedImage.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });

      // Create FormData
      const formData = new FormData();
      formData.append('image', blob, 'face.jpg');

      // Register face for the selected user using admin API
      const response = await adminAPI.registerFaceForUser(selectedUser.userId, formData);
      
      toast.success(`Face registered successfully for ${selectedUser.name}!`);
      setCapturedImage(null);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to register face');
    } finally {
      setRegistering(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="text-blue-600 hover:text-blue-700 mb-4 flex items-center"
            >
              <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Face Management</h1>
            <p className="mt-2 text-gray-600">Register and manage face recognition for users</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: User Selection */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Select User</h2>
              
              {/* Search */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search by name, user ID, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Users List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {loading ? (
                  <p className="text-gray-500 text-center py-4">Loading users...</p>
                ) : filteredUsers.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No users found</p>
                ) : (
                  filteredUsers.map((user) => (
                    <div
                      key={user._id}
                      onClick={() => setSelectedUser(user)}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedUser?._id === user._id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.userId} • {user.email}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {user.department} • {user.role}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            user.registered_faces >= 1
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {user.registered_faces || 0} faces
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {selectedUser && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">Selected User:</p>
                  <p className="text-lg font-bold text-blue-900">{selectedUser.name}</p>
                  <p className="text-sm text-blue-700">{selectedUser.userId}</p>
                </div>
              )}
            </div>

            {/* Right: Face Capture */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Capture Face</h2>
              
              {!selectedUser ? (
                <div className="text-center py-12 text-gray-500">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <p className="mt-4">Please select a user first</p>
                </div>
              ) : (
                <div>
                  <div className="mb-4">
                    <WebcamCapture
                      onCapture={handleFaceCapture}
                      onError={(error) => toast.error('Camera error: ' + error)}
                    />
                  </div>

                  {capturedImage && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                      <img
                        src={capturedImage}
                        alt="Captured face"
                        className="w-full rounded-lg border border-gray-300"
                      />
                    </div>
                  )}

                  <button
                    onClick={handleRegisterFace}
                    disabled={!capturedImage || registering}
                    className="w-full mt-4 px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {registering ? 'Registering...' : 'Register Face for User'}
                  </button>

                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Tips:</strong> Ensure good lighting, center the face, and keep a neutral expression.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
