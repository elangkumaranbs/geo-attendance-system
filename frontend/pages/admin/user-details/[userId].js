import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import { adminAPI } from '../../../utils/api';
import toast from 'react-hot-toast';

export default function UserDetails() {
  const router = useRouter();
  const { userId } = router.query;
  const [user, setUser] = useState(null);
  const [faces, setFaces] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (userId) {
      fetchUserDetails();
    }
  }, [userId]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getUserById(userId);
      setUser(response.data.data.user);
      setFaces(response.data.data.faces || []);
      setAttendance(response.data.data.recentAttendance || []);
    } catch (error) {
      toast.error('Failed to fetch user details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async () => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      await adminAPI.updateUserStatus(userId, newStatus);
      toast.success(`User ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      fetchUserDetails();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDeleteUser = async () => {
    if (!confirm(`Are you sure you want to delete ${user.name}? This action cannot be undone.`)) {
      return;
    }
    
    try {
      await adminAPI.deleteUser(userId);
      toast.success('User deleted successfully');
      router.push('/admin/dashboard');
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading user details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">User not found</h2>
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="mt-4 text-blue-600 hover:text-blue-800"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">User Details</h1>
        </div>

        {/* User Info Card */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-3xl font-bold text-blue-600">{user.name?.charAt(0)}</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                <p className="text-gray-600">{user.email}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    user.role === 'admin' ? 'bg-red-100 text-red-800' :
                    user.role === 'employee' ? 'bg-purple-100 text-purple-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {user.role}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.status}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleStatusToggle}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
              >
                {user.status === 'active' ? 'Deactivate' : 'Activate'}
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete User
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t">
            <div>
              <p className="text-sm text-gray-600">User ID</p>
              <p className="font-semibold text-gray-900">{user.userId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Department</p>
              <p className="font-semibold text-gray-900">{user.department || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              <p className="font-semibold text-gray-900">{user.phone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Registered Faces</p>
              <p className="font-semibold text-gray-900">{user.registered_faces || 0} / 5</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Last Login</p>
              <p className="font-semibold text-gray-900">
                {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Joined</p>
              <p className="font-semibold text-gray-900">
                {new Date(user.created_at || user.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-4 border-b">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-2 px-4 font-medium ${
                activeTab === 'profile'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('faces')}
              className={`py-2 px-4 font-medium ${
                activeTab === 'faces'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Faces ({faces.length})
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`py-2 px-4 font-medium ${
                activeTab === 'attendance'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Recent Attendance
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Profile Information</h3>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-gray-600">Full Name</dt>
                <dd className="text-base font-medium text-gray-900">{user.name}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-600">Email</dt>
                <dd className="text-base font-medium text-gray-900">{user.email}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-600">User ID</dt>
                <dd className="text-base font-medium text-gray-900">{user.userId}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-600">Role</dt>
                <dd className="text-base font-medium text-gray-900 capitalize">{user.role}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-600">Department</dt>
                <dd className="text-base font-medium text-gray-900">{user.department || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-600">Phone</dt>
                <dd className="text-base font-medium text-gray-900">{user.phone || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-600">Status</dt>
                <dd className="text-base font-medium text-gray-900 capitalize">{user.status}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-600">Account Created</dt>
                <dd className="text-base font-medium text-gray-900">
                  {new Date(user.created_at || user.createdAt).toLocaleString()}
                </dd>
              </div>
            </dl>
          </div>
        )}

        {activeTab === 'faces' && (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Registered Faces</h3>
              <button
                onClick={() => router.push('/admin/face-management')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add New Face
              </button>
            </div>
            {faces.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No faces registered yet</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {faces.map((face, index) => (
                  <div key={face._id} className="border rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-2">Face #{index + 1}</p>
                    <p className="text-xs text-gray-500">
                      Registered: {new Date(face.created_at || face.createdAt).toLocaleDateString()}
                    </p>
                    {face.is_primary && (
                      <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        Primary
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Attendance Records</h3>
            {attendance.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No attendance records found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check In</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check Out</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {attendance.map((record) => (
                      <tr key={record._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(record.check_in_time).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(record.check_in_time).toLocaleTimeString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.check_out_time ? new Date(record.check_out_time).toLocaleTimeString() : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.total_hours ? `${record.total_hours.toFixed(2)} hrs` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            record.status === 'present' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
