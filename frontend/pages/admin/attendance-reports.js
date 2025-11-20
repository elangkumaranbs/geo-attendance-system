import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { adminAPI } from '../../utils/api';
import toast from 'react-hot-toast';

export default function AttendanceReports() {
  const router = useRouter();
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [stats, setStats] = useState({ totalRecords: 0, presentToday: 0, averageHours: 0 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    userId: '',
    status: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [users, setUsers] = useState([]);
  const [detailedStats, setDetailedStats] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token || user.role !== 'admin') {
      toast.error('Access denied. Admin only.');
      router.push('/login');
      return;
    }

    fetchUsers();
    fetchAttendance();
    fetchDetailedStats();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await adminAPI.getAllUsers();
      const usersList = response.data.data?.users || response.data.users || [];
      setUsers(usersList);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchDetailedStats = async () => {
    try {
      const response = await adminAPI.getAttendanceStats(filters);
      setDetailedStats(response.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchAttendance = async (page = 1) => {
    try {
      setLoading(true);
      const params = { 
        ...filters, 
        page, 
        limit: pagination.limit 
      };
      
      const response = await adminAPI.getAllAttendance(params);
      const records = response.data.data?.records || [];
      const paginationData = response.data.data?.pagination || {};
      
      setAttendanceRecords(records);
      setPagination({
        page: paginationData.page || 1,
        limit: paginationData.limit || 10,
        total: paginationData.total || 0,
        pages: paginationData.pages || 0
      });
      
      // Calculate stats
      const today = new Date().toDateString();
      const presentToday = records.filter(r => 
        new Date(r.check_in_time).toDateString() === today
      ).length;
      
      const totalHours = records.reduce((sum, r) => sum + (r.total_hours || 0), 0);
      const averageHours = records.length > 0 ? totalHours / records.length : 0;

      setStats({
        totalRecords: paginationData.total || records.length,
        presentToday,
        averageHours: averageHours.toFixed(2)
      });

      fetchDetailedStats();
    } catch (error) {
      toast.error('Failed to fetch attendance records');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const applyFilters = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchAttendance(1);
  };

  const clearFilters = () => {
    setFilters({ startDate: '', endDate: '', userId: '', status: '' });
    setSearchTerm('');
    setPagination(prev => ({ ...prev, page: 1 }));
    setTimeout(() => fetchAttendance(1), 100);
  };

  const handlePageChange = (newPage) => {
    fetchAttendance(newPage);
  };

  const handleLimitChange = (newLimit) => {
    setPagination(prev => ({ ...prev, limit: parseInt(newLimit), page: 1 }));
    setTimeout(() => fetchAttendance(1), 100);
  };

  const setQuickDateRange = (range) => {
    const today = new Date();
    const endDate = today.toISOString().split('T')[0];
    let startDate = '';

    switch(range) {
      case 'today':
        startDate = endDate;
        break;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        startDate = yesterday.toISOString().split('T')[0];
        break;
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        startDate = weekAgo.toISOString().split('T')[0];
        break;
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        startDate = monthAgo.toISOString().split('T')[0];
        break;
      case 'all':
        startDate = '';
        break;
    }

    setFilters(prev => ({ ...prev, startDate, endDate: range === 'all' ? '' : endDate }));
    toast.success(`Date range set to: ${range}`);
  };

  const printReport = () => {
    window.print();
  };

  const exportToCSV = () => {
    if (attendanceRecords.length === 0) {
      toast.error('No records to export');
      return;
    }

    const headers = ['User ID', 'Name', 'Date', 'Check In', 'Check Out', 'Total Hours', 'Status', 'Location', 'Geofence'];
    const csvContent = [
      headers.join(','),
      ...attendanceRecords.map(record => [
        `"${record.userId}"`,
        `"${record.userName || 'N/A'}"`,
        `"${new Date(record.check_in_time).toLocaleDateString()}"`,
        `"${new Date(record.check_in_time).toLocaleTimeString()}"`,
        `"${record.check_out_time ? new Date(record.check_out_time).toLocaleTimeString() : 'N/A'}"`,
        record.total_hours ? record.total_hours.toFixed(2) : '0',
        `"${record.status}"`,
        `"${record.location?.latitude ? `${record.location.latitude}, ${record.location.longitude}` : 'N/A'}"`,
        `"${record.geofence_name || 'N/A'}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success('Report exported successfully');
  };

  // Filter records based on search term
  const filteredRecords = attendanceRecords.filter(record => 
    searchTerm === '' || 
    record.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.userId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8 animate-fadeIn">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="flex items-center text-gray-600 hover:text-primary-600 hover:scale-105 mb-4 transition-all duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">Attendance Reports</h1>
              <p className="text-gray-600 mt-2">View and analyze attendance records</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={exportToCSV}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg transition-all duration-200"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </button>
              <button
                onClick={printReport}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg transition-all duration-200"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-xl hover:scale-105 transition-all duration-300 animate-slideIn">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-500 rounded-md p-3 shadow-md">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Records</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalRecords}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow hover:shadow-xl hover:scale-105 transition-all duration-300 animate-slideIn delay-150">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3 shadow-md">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Present Today</p>
                <p className="text-2xl font-bold text-gray-900">{stats.presentToday}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow hover:shadow-xl hover:scale-105 transition-all duration-300 animate-slideIn delay-300">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-500 rounded-md p-3 shadow-md">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Hours/Day</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageHours}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Statistics */}
        {detailedStats && (
          <div className="bg-white shadow rounded-lg p-6 mb-6 animate-fadeIn">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Detailed Analytics
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-xl font-bold text-gray-900">{detailedStats.totalUsers || 0}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg hover:bg-green-100 transition-colors duration-200">
                <p className="text-sm text-green-600">Present</p>
                <p className="text-xl font-bold text-green-900">{detailedStats.stats?.present || 0}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg hover:bg-yellow-100 transition-colors duration-200">
                <p className="text-sm text-yellow-600">Late</p>
                <p className="text-xl font-bold text-yellow-900">{detailedStats.stats?.late || 0}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg hover:bg-blue-100 transition-colors duration-200">
                <p className="text-sm text-blue-600">Attendance Rate</p>
                <p className="text-xl font-bold text-blue-900">{detailedStats.attendanceRate || 0}%</p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-6 mb-6 animate-slideIn hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters & Search
            </h2>
            <div className="text-sm text-gray-500">
              {pagination.total} total records
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search by Name or User ID</label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search users..."
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              />
              <svg className="absolute left-3 top-3 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Quick Date Range Presets */}
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-700 self-center mr-2">Quick Select:</span>
            <button onClick={() => setQuickDateRange('today')} className="px-3 py-1 text-xs bg-primary-100 text-primary-700 rounded-full hover:bg-primary-200 hover:scale-105 transition-all duration-200">Today</button>
            <button onClick={() => setQuickDateRange('yesterday')} className="px-3 py-1 text-xs bg-primary-100 text-primary-700 rounded-full hover:bg-primary-200 hover:scale-105 transition-all duration-200">Yesterday</button>
            <button onClick={() => setQuickDateRange('week')} className="px-3 py-1 text-xs bg-primary-100 text-primary-700 rounded-full hover:bg-primary-200 hover:scale-105 transition-all duration-200">Last 7 Days</button>
            <button onClick={() => setQuickDateRange('month')} className="px-3 py-1 text-xs bg-primary-100 text-primary-700 rounded-full hover:bg-primary-200 hover:scale-105 transition-all duration-200">Last 30 Days</button>
            <button onClick={() => setQuickDateRange('all')} className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 hover:scale-105 transition-all duration-200">All Time</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select User</label>
              <select
                name="userId"
                value={filters.userId}
                onChange={handleFilterChange}
                className="input-field"
              >
                <option value="">All Users</option>
                {users.map(user => (
                  <option key={user.userId} value={user.userId}>
                    {user.name} ({user.userId})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="input-field"
              >
                <option value="">All Status</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
              </select>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={applyFilters}
              disabled={loading}
              className="btn-primary"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Apply Filters
            </button>
            <button
              onClick={clearFilters}
              disabled={loading}
              className="btn-secondary"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear All
            </button>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden animate-fadeIn">
          {loading ? (
            <div className="text-center py-12">
              <div className="relative mx-auto mb-6 w-16 h-16">
                <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-blue-600 border-r-blue-400"></div>
                <div className="absolute inset-2 animate-spin rounded-full border-4 border-transparent border-b-blue-600 border-l-blue-400" style={{animationDirection: 'reverse', animationDuration: '1s'}}></div>
              </div>
              <p className="mt-4 text-gray-600 font-medium animate-pulse-slow">Loading attendance records...</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-12 animate-fadeIn">
              <svg className="mx-auto h-16 w-16 text-gray-400 animate-pulse-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No records found</h3>
              <p className="mt-2 text-sm text-gray-500">No attendance records match your filters or search criteria.</p>
              <button
                onClick={clearFilters}
                className="mt-4 btn-secondary inline-flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset Filters
              </button>
            </div>
          ) : (
            <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRecords.map((record, index) => (
                    <tr key={record._id} className="hover:bg-gray-50 transition-colors duration-150 animate-fadeIn" style={{animationDelay: `${index * 30}ms`}}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{record.userName || 'Unknown'}</div>
                          <div className="text-sm text-gray-500">{record.userId}</div>
                        </div>
                      </td>
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
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          record.status === 'present' ? 'bg-green-100 text-green-800' :
                          record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.geofence_name || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 sm:px-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-700">Rows per page:</label>
                  <select
                    value={pagination.limit}
                    onChange={(e) => handleLimitChange(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    First
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    Previous
                  </button>
                  
                  <span className="px-3 py-1 text-sm text-gray-700 font-medium">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.pages}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.pages)}
                    disabled={pagination.page >= pagination.pages}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    Last
                  </button>
                </div>
              </div>
            </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
