import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Shield, 
  Settings, 
  BarChart3, 
  Flag, 
  CheckCircle, 
  XCircle, 
  MoreVertical,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Ban,
  Unlock,
  Crown,
  UserCheck,
  UserX,
  TrendingUp,
  Activity,
  Calendar,
  MessageSquare,
  Briefcase,
  Trophy,
  Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';

const Admin = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [filters, setFilters] = useState({
    role: '',
    status: '',
    search: ''
  });

  // Fetch admin dashboard data
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery(
    ['admin-dashboard'],
    () => api.get('/admin/dashboard'),
    { enabled: !!user }
  );

  // Fetch users for management
  const { data: usersData, isLoading: usersLoading } = useQuery(
    ['admin-users', filters],
    () => api.get('/admin/users', { params: filters }),
    { enabled: !!user }
  );

  // Update user status mutation
  const updateUserStatusMutation = useMutation(
    ({ userId, status }) => api.put(`/admin/users/${userId}/status`, { status }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-users']);
        queryClient.invalidateQueries(['admin-dashboard']);
        toast.success('User status updated successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update user status');
      }
    }
  );

  // Update user role mutation
  const updateUserRoleMutation = useMutation(
    ({ userId, role }) => api.put(`/admin/users/${userId}/role`, { role }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-users']);
        queryClient.invalidateQueries(['admin-dashboard']);
        toast.success('User role updated successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update user role');
      }
    }
  );

  const handleUpdateUserStatus = (userId, status) => {
    updateUserStatusMutation.mutate({ userId, status });
  };

  const handleUpdateUserRole = (userId, role) => {
    updateUserRoleMutation.mutate({ userId, role });
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'content', label: 'Content Moderation', icon: Flag },
    { id: 'settings', label: 'System Settings', icon: Settings }
  ];

  const stats = [
    { label: 'Total Users', value: dashboardData?.stats?.totalUsers || 0, icon: Users, color: 'text-blue-600' },
    { label: 'Active Users', value: dashboardData?.stats?.activeUsers || 0, icon: UserCheck, color: 'text-green-600' },
    { label: 'Pending Approvals', value: dashboardData?.stats?.pendingApprovals || 0, icon: Clock, color: 'text-yellow-600' },
    { label: 'Total Posts', value: dashboardData?.stats?.totalPosts || 0, icon: MessageSquare, color: 'text-purple-600' },
    { label: 'Active Jobs', value: dashboardData?.stats?.activeJobs || 0, icon: Briefcase, color: 'text-indigo-600' },
    { label: 'Ongoing Contests', value: dashboardData?.stats?.ongoingContests || 0, icon: Trophy, color: 'text-orange-600' }
  ];

  if (dashboardLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">Manage your platform and monitor system performance</p>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-5 h-5 inline mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'dashboard' && (
            <DashboardTab data={dashboardData} stats={stats} />
          )}
          {activeTab === 'users' && (
            <UsersTab
              data={usersData}
              loading={usersLoading}
              filters={filters}
              setFilters={setFilters}
              onUpdateStatus={handleUpdateUserStatus}
              onUpdateRole={handleUpdateUserRole}
              onSelectUser={setSelectedUser}
              onShowModal={setShowUserModal}
            />
          )}
          {activeTab === 'content' && (
            <ContentModerationTab />
          )}
          {activeTab === 'settings' && (
            <SystemSettingsTab />
          )}
        </motion.div>
      </AnimatePresence>

      {/* User Detail Modal */}
      {showUserModal && selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => {
            setShowUserModal(false);
            setSelectedUser(null);
          }}
          onUpdateStatus={handleUpdateUserStatus}
          onUpdateRole={handleUpdateUserRole}
        />
      )}
    </div>
  );
};

// Dashboard Tab Component
const DashboardTab = ({ data, stats }) => {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center">
                <div className={`p-2 rounded-lg bg-gray-100 ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        </div>
        <div className="p-6">
          {data?.recentActivity?.length > 0 ? (
            <div className="space-y-4">
              {data.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                  <span className="text-sm text-gray-600">{activity.description}</span>
                  <span className="text-xs text-gray-400 ml-auto">
                    {new Date(activity.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No recent activity</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left">
              <Users className="w-8 h-8 text-blue-600 mb-2" />
              <h4 className="font-medium text-gray-900">Review Users</h4>
              <p className="text-sm text-gray-600">Approve pending registrations</p>
            </button>
            <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left">
              <Flag className="w-8 h-8 text-red-600 mb-2" />
              <h4 className="font-medium text-gray-900">Moderate Content</h4>
              <p className="text-sm text-gray-600">Review reported content</p>
            </button>
            <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left">
              <Settings className="w-8 h-8 text-gray-600 mb-2" />
              <h4 className="font-medium text-gray-900">System Settings</h4>
              <p className="text-sm text-gray-600">Configure platform settings</p>
            </button>
            <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left">
              <BarChart3 className="w-8 h-8 text-green-600 mb-2" />
              <h4 className="font-medium text-gray-900">View Reports</h4>
              <p className="text-sm text-gray-600">Analytics and insights</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Users Tab Component
const UsersTab = ({ data, loading, filters, setFilters, onUpdateStatus, onUpdateRole, onSelectUser, onShowModal }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'alumni':
        return 'bg-blue-100 text-blue-800';
      case 'student':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search users..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          <select
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="alumni">Alumni</option>
            <option value="student">Student</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">User Management</h3>
        </div>
        
        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data?.users?.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-alumni-500 rounded-full flex items-center justify-center text-white font-medium">
                          {user.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                        {user.role === 'admin' && <Crown className="w-3 h-3 mr-1" />}
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                        {user.status === 'active' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {user.status === 'suspended' && <XCircle className="w-3 h-3 mr-1" />}
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            onSelectUser(user);
                            onShowModal(true);
                          }}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <select
                          value={user.role}
                          onChange={(e) => onUpdateRole(user._id, e.target.value)}
                          className="text-xs border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="student">Student</option>
                          <option value="alumni">Alumni</option>
                          <option value="admin">Admin</option>
                        </select>
                        <select
                          value={user.status}
                          onChange={(e) => onUpdateStatus(user._id, e.target.value)}
                          className="text-xs border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="active">Active</option>
                          <option value="pending">Pending</option>
                          <option value="suspended">Suspended</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// Content Moderation Tab Component
const ContentModerationTab = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Content Moderation</h3>
        <p className="text-gray-600">Content moderation features will be implemented here.</p>
      </div>
    </div>
  );
};

// System Settings Tab Component
const SystemSettingsTab = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">System Settings</h3>
        <p className="text-gray-600">System configuration options will be implemented here.</p>
      </div>
    </div>
  );
};

// User Detail Modal Component
const UserDetailModal = ({ user, onClose, onUpdateStatus, onUpdateRole }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">User Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* User Info */}
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-gradient-to-r from-primary-500 to-alumni-500 rounded-full flex items-center justify-center text-white text-2xl font-medium">
              {user.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{user.name}</h3>
              <p className="text-gray-600">{user.email}</p>
              <p className="text-sm text-gray-500">Member since {new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          {/* User Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Role</h4>
              <select
                value={user.role}
                onChange={(e) => onUpdateRole(user._id, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="student">Student</option>
                <option value="alumni">Alumni</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Status</h4>
              <select
                value={user.status}
                onChange={(e) => onUpdateStatus(user._id, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          {/* Additional Info */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Additional Information</h4>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Last Login:</span>
                <span className="text-sm text-gray-900">
                  {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Email Verified:</span>
                <span className="text-sm text-gray-900">
                  {user.emailVerified ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Profile Complete:</span>
                <span className="text-sm text-gray-900">
                  {user.profileComplete ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
