import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import FacePatternTrainer from '../../components/FacePatternTrainer';
import { adminAPI, authAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'users', label: 'Users' },
  { id: 'add-user', label: 'Add User' },
];

const REQUIRED_FACE_PATTERNS = 3;

export default function AdminDashboard() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ total: 0, students: 0, employees: 0, admins: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || user.role !== 'admin') {
      toast.error('Access denied. Admin only.');
      router.push('/login');
      return;
    }

    fetchUsers();
  }, [router]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllUsers();
      const usersList = response.data.data?.users || response.data.users || [];
      setUsers(usersList);
      setStats({
        total: usersList.length,
        students: usersList.filter((u) => u.role === 'student').length,
        employees: usersList.filter((u) => u.role === 'employee').length,
        admins: usersList.filter((u) => u.role === 'admin').length,
      });
    } catch (error) {
      toast.error('Failed to fetch users');
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderTabContent = () => {
    if (activeTab === 'overview') {
      return <OverviewSection stats={stats} loading={loading} onRefresh={fetchUsers} />;
    }

    if (activeTab === 'users') {
      return <UsersTable users={users} loading={loading} />;
    }

    return <AddUserForm onSuccess={fetchUsers} />;
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-10 px-4 space-y-10">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between animate-fadeIn">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">Admin Dashboard</h1>
            <p className="text-gray-600">Manage users, monitor attendance stats, and train face patterns.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => router.push('/admin/attendance-reports')}
              className="inline-flex items-center justify-center rounded-md bg-green-600 px-5 py-3 text-white font-semibold hover:bg-green-700 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              View Reports
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('add-user')}
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-5 py-3 text-white font-semibold hover:bg-blue-700 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600"
            >
              + Add User
            </button>
          </div>
        </header>

        <TabList activeTab={activeTab} onChange={setActiveTab} />

        <section>{renderTabContent()}</section>
      </div>
    </Layout>
  );
}

function TabList({ activeTab, onChange }) {
  return (
    <div className="flex flex-wrap gap-3 border-b border-gray-200 pb-2">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
            activeTab === tab.id ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-105'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function OverviewSection({ stats, loading, onRefresh }) {
  if (loading) {
    return <LoadingState message="Loading dashboard metrics..." />;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Users" value={stats.total} accent="bg-blue-50 text-blue-700" delay="delay-75" />
        <StatCard label="Students" value={stats.students} accent="bg-green-50 text-green-700" delay="delay-150" />
        <StatCard label="Employees" value={stats.employees} accent="bg-yellow-50 text-yellow-700" delay="delay-300" />
        <StatCard label="Admins" value={stats.admins} accent="bg-purple-50 text-purple-700" delay="delay-500" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-6 hover:shadow-lg transition-shadow duration-300">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Attendance Reports
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            View detailed attendance reports, filter by date range, export data, and analyze attendance patterns.
          </p>
          <button
            type="button"
            onClick={() => window.location.href = '/admin/attendance-reports'}
            className="mt-4 inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg transition-all duration-200"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            View Reports
          </button>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 hover:shadow-lg transition-shadow duration-300">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Face Pattern Progress
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            Keep users trained with at least three reliable face patterns to improve attendance accuracy.
          </p>
          <button
            type="button"
            onClick={onRefresh}
            className="mt-4 inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:scale-105 transition-all duration-200"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh data
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent, delay }) {
  return (
    <div className={`rounded-lg border border-gray-200 bg-white p-5 hover:shadow-xl hover:scale-105 transition-all duration-300 animate-slideIn ${delay || ''}`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-3 text-3xl font-bold ${accent}`}>{value}</p>
    </div>
  );
}

function UsersTable({ users, loading }) {
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const router = useRouter();

  if (loading) {
    return <LoadingState message="Loading users..." />;
  }

  if (!users.length) {
    return <EmptyState message="No users found yet. Add a user to get started." />;
  }

  const handleEdit = (user) => {
    setEditingUser(user._id || user.userId);
    setEditFormData({
      name: user.name,
      email: user.email,
      department: user.department || '',
      phone: user.phone || '',
      role: user.role,
    });
  };

  const handleSaveEdit = async (userId) => {
    try {
      await authAPI.updateProfile(editFormData);
      toast.success('User updated successfully');
      setEditingUser(null);
      window.location.reload();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user');
    }
  };

  const handleDelete = async (user) => {
    if (!confirm(`Are you sure you want to delete ${user.name}? This action cannot be undone.`)) {
      return;
    }

    try {
      await adminAPI.deleteUser(user.userId);
      toast.success('User deleted successfully');
      window.location.reload();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      await adminAPI.updateUserStatus(user.userId, newStatus);
      toast.success(`User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
      window.location.reload();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">User ID</th>
              <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
              <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Email</th>
              <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Role</th>
              <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Department</th>
              <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
              <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Faces</th>
              <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {users.map((user) => {
              const isEditing = editingUser === (user._id || user.userId);
              
              return (
                <tr key={user._id || user.userId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.userId || '-'}</td>
                  
                  {isEditing ? (
                    <>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={editFormData.name}
                          onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="email"
                          value={editFormData.email}
                          onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={editFormData.role}
                          onChange={(e) => setEditFormData({...editFormData, role: e.target.value})}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                        >
                          <option value="student">Student</option>
                          <option value="employee">Employee</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={editFormData.department}
                          onChange={(e) => setEditFormData({...editFormData, department: e.target.value})}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                        />
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 text-sm text-gray-700">{user.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{user.email}</td>
                      <td className="px-6 py-4 text-sm capitalize text-gray-700">{user.role}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{user.department || '—'}</td>
                    </>
                  )}
                  
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.status || 'active'}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 text-sm text-gray-700">{user.registered_faces || 0}</td>
                  
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => handleSaveEdit(user._id)}
                            className="text-green-600 hover:text-green-800 font-medium"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingUser(null)}
                            className="text-gray-600 hover:text-gray-800 font-medium"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => router.push(`/admin/user-details/${user.userId}`)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleEdit(user)}
                            className="text-indigo-600 hover:text-indigo-800 font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleStatus(user)}
                            className={`font-medium ${
                              user.status === 'active' ? 'text-orange-600 hover:text-orange-800' : 'text-green-600 hover:text-green-800'
                            }`}
                          >
                            {user.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDelete(user)}
                            className="text-red-600 hover:text-red-800 font-medium"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LoadingState({ message }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-gray-600">
      {message}
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
      {message}
    </div>
  );
}

function AddUserForm({ onSuccess = () => {} }) {
  const createInitialFormState = () => ({
    userId: '',
    name: '',
    email: '',
    password: 'esec123',
    role: 'student',
    department: '',
    phone: '',
    gender: '',
  });

  const [formData, setFormData] = useState(createInitialFormState);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [createdUser, setCreatedUser] = useState(null);
  const [trainedCount, setTrainedCount] = useState(0);

  const resetFlow = () => {
    setFormData(createInitialFormState());
    setStep(1);
    setCreatedUser(null);
    setTrainedCount(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step !== 1) return;

    setLoading(true);
    try {
      const response = await authAPI.register(formData);
      const user = response.data?.data?.user;
      toast.success('User profile created. Proceed with face pattern training.');
      setCreatedUser(user);
      setTrainedCount(user?.registered_faces || 0);
      setStep(2);
      onSuccess();
    } catch (error) {
      console.error('Failed to create user', error);
      toast.error(error.response?.data?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleTrainingProgress = (count) => {
    setTrainedCount(count);
  };

  const handleFinishEnrollment = () => {
    toast.success('Face patterns enrolled successfully');
    resetFlow();
    onSuccess();
  };

  const handleSkipTraining = () => {
    toast('User saved without face patterns. You can train later from user details.', {
      icon: '⚠️',
    });
    resetFlow();
  };

  const renderStepIndicator = () => (
    <div className="mb-6 flex items-center gap-4">
      {[1, 2].map((current) => (
        <div key={current} className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold ${
            step === current ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            {current}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">
              {current === 1 ? 'User Details' : 'Face Pattern Training'}
            </p>
            <p className="text-xs text-gray-500">
              {current === 1 ? 'Basic profile information' : 'Train ML model with face patterns'}
            </p>
          </div>
          {current === 1 && <div className="h-px w-16 bg-gray-300" aria-hidden="true"></div>}
        </div>
      ))}
    </div>
  );

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Add New User</h2>
        <span className="text-sm text-gray-500">Step {step} of 2</span>
      </div>

      {renderStepIndicator()}

      {step === 1 && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">User ID *</label>
              <input
                type="text"
                name="userId"
                value={formData.userId}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                placeholder="STU001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password *</label>
              <input
                type="text"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                readOnly
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm bg-gray-100 cursor-not-allowed"
                placeholder="esec123"
              />
              <p className="mt-1 text-sm text-gray-500">Default password: esec123</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Role *</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              >
                <option value="student">Student</option>
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Department</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                placeholder="Computer Science"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                placeholder="+1234567890"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-blue-600 px-6 py-3 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Creating user…' : 'Save & Continue'}
            </button>
          </div>
        </form>
      )}

      {step === 2 && createdUser && (
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div>
              <p className="text-sm text-blue-800">Training face patterns for</p>
              <p className="text-xl font-semibold text-blue-900">
                {createdUser.name} ({createdUser.userId})
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-700">Patterns stored</p>
              <p className="text-2xl font-bold text-blue-900">
                {trainedCount}/{REQUIRED_FACE_PATTERNS}
              </p>
            </div>
          </div>

          <FacePatternTrainer
            user={createdUser}
            requiredCount={REQUIRED_FACE_PATTERNS}
            onProgress={handleTrainingProgress}
          />

          <div className="flex flex-wrap justify-end gap-3">
            <button type="button" onClick={handleSkipTraining} className="btn-secondary">
              Skip For Now
            </button>
            <button
              type="button"
              onClick={handleFinishEnrollment}
              disabled={trainedCount < REQUIRED_FACE_PATTERNS}
              className="btn-primary disabled:opacity-50"
            >
              {trainedCount < REQUIRED_FACE_PATTERNS
                ? `Capture ${REQUIRED_FACE_PATTERNS - trainedCount} more pattern(s)`
                : 'Finish Enrollment'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
