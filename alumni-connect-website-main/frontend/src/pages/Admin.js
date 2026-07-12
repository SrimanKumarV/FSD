import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
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
  Clock,
  Bell,
  MessageSquarePlus,
  LifeBuoy,
  Star,
  Send,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import DefaultAvatar from '../components/DefaultAvatar';

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
    () => api.get('/admin/dashboard').then(res => res.data),
    { enabled: !!user }
  );

  // Fetch admin analytics data for charts
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery(
    ['admin-analytics'],
    () => api.get('/admin/analytics').then(res => res.data),
    { enabled: !!user }
  );

  // Fetch users for management
  const { data: usersData, isLoading: usersLoading } = useQuery(
    ['admin-users', filters],
    () => api.get('/admin/users', { params: filters }).then(res => res.data),
    { enabled: !!user }
  );

  // Fetch feedback for admin
  const [fbPage, setFbPage] = useState(1);
  const [fbStatus, setFbStatus] = useState('');
  const { data: feedbackData, isLoading: feedbackLoading, refetch: refetchFeedback } = useQuery(
    ['admin-feedback', fbPage, fbStatus, activeTab],
    () => api.get('/feedback', { params: { page: fbPage, status: fbStatus } }).then(res => res.data),
    { enabled: activeTab === 'feedback' && !!user }
  );

  // Fetch help desk tickets for admin
  const [hdPage, setHdPage] = useState(1);
  const [hdStatus, setHdStatus] = useState('');
  const { data: helpdeskData, isLoading: helpdeskLoading, refetch: refetchHelpdesk } = useQuery(
    ['admin-helpdesk', hdPage, hdStatus, activeTab],
    () => api.get('/helpdesk', { params: { page: hdPage, status: hdStatus } }).then(res => res.data),
    { enabled: activeTab === 'helpdesk' && !!user }
  );

  // Approve user mutation
  const approveUserMutation = useMutation(
    ({ userId, isApproved }) => api.put(`/admin/users/${userId}/approval`, { isApproved }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-users']);
        queryClient.invalidateQueries(['admin-dashboard']);
        toast.success('User approval updated successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update user approval');
      }
    }
  );

  // Suspend user mutation
  const suspendUserMutation = useMutation(
    ({ userId, isSuspended }) => api.put(`/admin/users/${userId}/suspend`, { isSuspended, reason: isSuspended ? 'Suspended by admin' : '' }),
    {
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries(['admin-users']);
        queryClient.invalidateQueries(['admin-dashboard']);
        toast.success(`User ${variables.isSuspended ? 'suspended' : 'unsuspended'} successfully`);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update user suspension');
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

  const handleApproveUser = (userId, isApproved) => {
    approveUserMutation.mutate({ userId, isApproved });
  };

  const handleSuspendUser = (userId, isSuspended) => {
    suspendUserMutation.mutate({ userId, isSuspended });
  };

  const handleUpdateUserRole = (userId, role) => {
    updateUserRoleMutation.mutate({ userId, role });
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'feedback', label: 'Feedback', icon: MessageSquarePlus },
    { id: 'helpdesk', label: 'Help Desk', icon: LifeBuoy },
    { id: 'content', label: 'Content Moderation', icon: Flag },
    { id: 'settings', label: 'System Settings', icon: Settings }
  ];

  const stats = [
    { label: 'Total Users', value: dashboardData?.stats?.totalUsers || 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Active Users', value: dashboardData?.stats?.activeUsers || 0, icon: UserCheck, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Pending Approvals', value: dashboardData?.stats?.pendingApprovals || 0, icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    { label: 'Total Posts', value: dashboardData?.stats?.totalPosts || 0, icon: MessageSquare, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Active Jobs', value: dashboardData?.stats?.activeJobs || 0, icon: Briefcase, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { label: 'Ongoing Contests', value: dashboardData?.stats?.ongoingContests || 0, icon: Trophy, color: 'text-orange-500', bg: 'bg-orange-500/10' }
  ];

  if (dashboardLoading || analyticsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
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
            <DashboardTab data={dashboardData} analyticsData={analyticsData} stats={stats} />
          )}
          {activeTab === 'users' && (
            <UsersTab
              data={usersData}
              loading={usersLoading}
              filters={filters}
              setFilters={setFilters}
              onApproveUser={handleApproveUser}
              onSuspendUser={handleSuspendUser}
              onUpdateRole={handleUpdateUserRole}
              onSelectUser={setSelectedUser}
              onShowModal={setShowUserModal}
            />
          )}
          {activeTab === 'feedback' && (
            <FeedbackAdminTab
              data={feedbackData}
              loading={feedbackLoading}
              page={fbPage}
              setPage={setFbPage}
              status={fbStatus}
              setStatus={setFbStatus}
              refetch={refetchFeedback}
              queryClient={queryClient}
            />
          )}
          {activeTab === 'helpdesk' && (
            <HelpDeskAdminTab
              data={helpdeskData}
              loading={helpdeskLoading}
              page={hdPage}
              setPage={setHdPage}
              status={hdStatus}
              setStatus={setHdStatus}
              refetch={refetchHelpdesk}
              queryClient={queryClient}
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
          onApproveUser={handleApproveUser}
          onSuspendUser={handleSuspendUser}
          onUpdateRole={handleUpdateUserRole}
        />
      )}
    </div>
  );
};

// Dashboard Tab Component
const DashboardTab = ({ data, analyticsData, stats }) => {
  const PIE_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B'];
  
  // Format content growth data for pie chart
  const contentData = [
    { name: 'Jobs', value: analyticsData?.analytics?.contentGrowth?.jobs || 0 },
    { name: 'Events', value: analyticsData?.analytics?.contentGrowth?.events || 0 },
    { name: 'Posts', value: analyticsData?.analytics?.contentGrowth?.posts || 0 },
    { name: 'Contests', value: analyticsData?.analytics?.contentGrowth?.contests || 0 },
  ].filter(item => item.value > 0);

  // Fallback if no new content
  if (contentData.length === 0) {
    contentData.push({ name: 'No New Content', value: 1 });
  }

  // Mock time-series data for user growth (since backend only returns totals)
  // In a real scenario, the backend should return daily/weekly historical data.
  const userGrowthData = [
    { name: 'Week 1', Users: Math.floor((analyticsData?.analytics?.userGrowth?.total || 100) * 0.8) },
    { name: 'Week 2', Users: Math.floor((analyticsData?.analytics?.userGrowth?.total || 100) * 0.85) },
    { name: 'Week 3', Users: Math.floor((analyticsData?.analytics?.userGrowth?.total || 100) * 0.92) },
    { name: 'Week 4', Users: analyticsData?.analytics?.userGrowth?.total || 100 },
  ];

  return (
    <div className="space-y-6">
      {/* Dynamic Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="glass-card rounded-2xl p-6 relative overflow-hidden group border border-white/20 dark:border-gray-700/50"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stat.value.toLocaleString()}</p>
                </div>
                <div className={`p-4 rounded-xl ${stat.bg} shadow-inner`}>
                  <Icon className={`w-7 h-7 ${stat.color}`} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Area Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6"
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">User Growth (Last 30 Days)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={userGrowthData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.2} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1F2937', borderRadius: '12px', border: 'none', color: '#fff' }}
                  itemStyle={{ color: '#60A5FA' }}
                />
                <Area type="monotone" dataKey="Users" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Content Distribution Pie Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 flex flex-col"
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">New Content Distribution</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Breakdown of platform activity (Last 30 days)</p>
          <div className="h-64 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={contentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {contentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1F2937', borderRadius: '12px', border: 'none', color: '#fff' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Engagement & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Engagement Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-primary-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="relative z-10">
            <h3 className="text-lg font-bold mb-6 flex items-center"><Activity className="w-5 h-5 mr-2"/> Engagement Overview</h3>
            <div className="space-y-6">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                <p className="text-primary-100 text-sm">Total Network Connections</p>
                <p className="text-3xl font-bold">{analyticsData?.analytics?.engagement?.totalConnections || 0}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                <p className="text-primary-100 text-sm">Active Mentorships</p>
                <p className="text-3xl font-bold">{analyticsData?.analytics?.engagement?.totalMentorships || 0}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                <p className="text-primary-100 text-sm">Messages Exchanged</p>
                <p className="text-3xl font-bold">{analyticsData?.analytics?.engagement?.totalMessages || 0}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Recent Activity List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700"
        >
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent System Activity</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {data?.recentActivities?.users?.slice(0, 5).map((user, index) => (
                <div key={`user-${index}`} className="flex items-center space-x-4 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-colors">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <UserCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">New user registered: {user.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user.email} • {user.role}</p>
                  </div>
                  <div className="text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
              {data?.recentActivities?.jobs?.slice(0, 5).map((job, index) => (
                <div key={`job-${index}`} className="flex items-center space-x-4 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-colors">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">New job posted: {job.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{job.company}</p>
                  </div>
                  <div className="text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
                    {new Date(job.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
              
              {(!data?.recentActivities?.users?.length && !data?.recentActivities?.jobs?.length) && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>No recent activity found on the platform.</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// Users Tab Component
const UsersTab = ({ data, loading, filters, setFilters, onApproveUser, onSuspendUser, onUpdateRole, onSelectUser, onShowModal }) => {
  const getStatusColor = (user) => {
    if (user.isSuspended) return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
    if (user.role === 'alumni' && !user.isApproved) return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20';
    return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
  };

  const getStatusText = (user) => {
    if (user.isSuspended) return 'Suspended';
    if (user.role === 'alumni' && !user.isApproved) return 'Pending Approval';
    return 'Active';
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      case 'alumni': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'student': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      default: return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters (Glassmorphism) */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl border border-white/20 dark:border-gray-700/50 p-6"
      >
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-12 pr-4 py-3 bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <select
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
            className="px-4 py-3 bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-primary-500 transition-all outline-none"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="alumni">Alumni</option>
            <option value="student">Student</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-3 bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-primary-500 transition-all outline-none"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending Approval</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </motion.div>

      {/* Users Modern Table */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-2xl border border-white/20 dark:border-gray-700/50 overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-gray-200/50 dark:border-gray-700/50 flex justify-between items-center bg-white/30 dark:bg-gray-800/30">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">User Directory</h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">{data?.users?.length || 0} users found</span>
        </div>
        
        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200/50 dark:divide-gray-700/50">
              <thead className="bg-gray-50/50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
                {data?.users?.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      No users found matching the filters.
                    </td>
                  </tr>
                ) : data?.users?.map((user) => (
                  <tr key={user._id} className="hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {user.photo && user.photo !== 'default-avatar.png' ? (
                          <img src={user.photo} alt={user.name} className="w-10 h-10 rounded-xl object-cover shadow-sm border border-gray-200 dark:border-gray-700" />
                        ) : (
                          <DefaultAvatar className="w-10 h-10 flex-shrink-0" />
                        )}
                        <div className="ml-4">
                          <div className="text-sm font-bold text-gray-900 dark:text-white">{user.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-lg border ${getRoleColor(user.role)}`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-lg border ${getStatusColor(user)}`}>
                        {getStatusText(user)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => {
                          onSelectUser(user);
                          onShowModal(true);
                        }}
                        className="text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors p-2 bg-gray-100 dark:bg-gray-800 rounded-lg"
                        title="Edit User"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      
                      {user.role === 'alumni' && !user.isApproved && (
                        <button
                          onClick={() => onApproveUser(user._id, true)}
                          className="text-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg"
                          title="Approve Alumni"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => onSuspendUser(user._id, !user.isSuspended)}
                        className={`${user.isSuspended ? 'text-green-500 hover:text-green-600 bg-green-50 dark:bg-green-900/20' : 'text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-900/20'} transition-colors p-2 rounded-lg`}
                        title={user.isSuspended ? "Unsuspend User" : "Suspend User"}
                      >
                        {user.isSuspended ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
};

// Content Moderation Tab Component
const ContentModerationTab = () => {
  const queryClient = useQueryClient();
  const [activeModTab, setActiveModTab] = useState('jobs');
  
  // Fetch flagged content
  const { data: moderationData, isLoading } = useQuery(
    ['admin-moderation'],
    () => api.get('/admin/moderation')
  );

  // Moderate content mutation
  const moderateMutation = useMutation(
    ({ type, id, action, reason }) => api.post(`/admin/moderate/${type}/${id}`, { action, reason }),
    {
      onSuccess: () => {
        toast.success('Action applied successfully');
        queryClient.invalidateQueries(['admin-moderation']);
      },
      onError: (error) => toast.error(error.response?.data?.message || 'Failed to apply action')
    }
  );

  const handleModerate = (type, id, action) => {
    let reason = '';
    if (action === 'reject' || action === 'warn') {
      reason = window.prompt(`Please provide a reason for this ${action}:`);
      if (reason === null) return; // User cancelled
    }
    moderateMutation.mutate({ type, id, action, reason });
  };

  const modTabs = [
    { id: 'jobs', label: 'Jobs', icon: Briefcase },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'posts', label: 'Forum Posts', icon: MessageSquare },
    { id: 'contests', label: 'Contests', icon: Trophy }
  ];

  const renderContentList = (items, type) => {
    if (!items || items.length === 0) {
      return (
        <div className="p-12 text-center text-gray-500 dark:text-gray-400">
          <Shield className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>No flagged {type} found. Queue is clean!</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item._id} className="p-5 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white">{item.title || item.content?.substring(0, 50)}</h4>
                <p className="text-sm text-gray-500 mt-1">Posted by: {item.author?.name || item.creator?.name || 'Unknown User'}</p>
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-900 p-3 rounded-lg">
                  {item.description || item.content}
                </div>
                {item.moderationFlags?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.moderationFlags.map((flag, idx) => (
                      <span key={idx} className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-semibold rounded-md flex items-center">
                        <Flag className="w-3 h-3 mr-1" /> {flag.reason}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col space-y-2 ml-4">
                <button
                  onClick={() => handleModerate(type, item._id, 'approve')}
                  disabled={moderateMutation.isLoading}
                  className="px-4 py-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 hover:bg-emerald-100 rounded-lg text-sm font-bold flex items-center justify-center transition-colors"
                >
                  <CheckCircle className="w-4 h-4 mr-1" /> Approve
                </button>
                <button
                  onClick={() => handleModerate(type, item._id, 'reject')}
                  disabled={moderateMutation.isLoading}
                  className="px-4 py-2 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 hover:bg-red-100 rounded-lg text-sm font-bold flex items-center justify-center transition-colors"
                >
                  <Ban className="w-4 h-4 mr-1" /> Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl border border-white/20 dark:border-gray-700/50 overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50 bg-white/30 dark:bg-gray-800/30 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
              <Shield className="w-5 h-5 mr-2 text-primary-500" />
              Content Moderation Queue
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Review flagged content reported by users or automated systems.</p>
          </div>
        </div>

        <div className="border-b border-gray-200 dark:border-gray-700 px-6">
          <nav className="-mb-px flex space-x-6 overflow-x-auto">
            {modTabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeModTab === tab.id;
              const count = moderationData?.data?.[tab.id]?.length || 0;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveModTab(tab.id)}
                  className={`py-4 px-1 inline-flex items-center text-sm font-bold border-b-2 transition-colors ${
                    isActive
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                  {count > 0 && (
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${isActive ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700'}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6 bg-gray-50/50 dark:bg-gray-900/20">
          {isLoading ? (
            <div className="p-12 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
          ) : (
            renderContentList(moderationData?.data?.[activeModTab], activeModTab)
          )}
        </div>
      </motion.div>
    </div>
  );
};

// System Settings Tab Component
const SystemSettingsTab = () => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('announcement');
  const [recipients, setRecipients] = useState('all');

  const sendNotificationMutation = useMutation(
    (data) => api.post('/admin/notifications', data),
    {
      onSuccess: () => {
        toast.success('System notification sent successfully!');
        setTitle('');
        setContent('');
        queryClient.invalidateQueries(['notifications']);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to send notification');
      }
    }
  );

  const handleSendNotification = (e) => {
    e.preventDefault();
    if (!title || !content) {
      toast.error('Title and content are required');
      return;
    }
    sendNotificationMutation.mutate({ title, content, type, recipients });
  };

  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl border border-white/20 dark:border-gray-700/50 p-6 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center">
            <Settings className="w-6 h-6 mr-2 text-primary-500" />
            System Broadcasts
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-8 text-sm">Send a priority notification or email broadcast to users across the platform.</p>
          
          <form onSubmit={handleSendNotification} className="space-y-6 max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Notification Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 transition-all outline-none"
                >
                  <option value="announcement">Public Announcement</option>
                  <option value="maintenance">System Maintenance</option>
                  <option value="update">Feature Update</option>
                  <option value="warning">System Warning</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Target Audience</label>
                <select
                  value={recipients}
                  onChange={(e) => setRecipients(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 transition-all outline-none"
                >
                  <option value="all">All Users</option>
                  <option value="alumni">Alumni Only</option>
                  <option value="students">Students Only</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Broadcast Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Scheduled Maintenance Notice"
                className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 transition-all outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Message Body</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows="4"
                placeholder="Type the full message here..."
                className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 transition-all outline-none resize-none"
              ></textarea>
            </div>
            
            <button
              type="submit"
              disabled={sendNotificationMutation.isLoading}
              className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg shadow-primary-500/30 transition-all disabled:opacity-50 flex items-center justify-center w-full md:w-auto"
            >
              {sendNotificationMutation.isLoading ? 'Broadcasting...' : 'Send Broadcast Notification'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

// User Detail Modal Component
const UserDetailModal = ({ user, onClose, onApproveUser, onSuspendUser, onUpdateRole }) => {
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
            {user.photo && user.photo !== 'default-avatar.png' ? (
              <img src={user.photo} alt={user.name} className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <DefaultAvatar className="w-20 h-20 flex-shrink-0" />
            )}
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
              <h4 className="text-sm font-medium text-gray-900 mb-2">Actions</h4>
              <div className="flex space-x-2">
                {user.role === 'alumni' && !user.isApproved && (
                  <button
                    onClick={() => onApproveUser(user._id, true)}
                    className="w-full text-sm bg-green-100 text-green-700 px-3 py-2 rounded-lg hover:bg-green-200 font-semibold transition-colors"
                  >
                    Approve Alumni
                  </button>
                )}
                {!user.isSuspended ? (
                  <button
                    onClick={() => onSuspendUser(user._id, true)}
                    className="w-full text-sm bg-red-100 text-red-700 px-3 py-2 rounded-lg hover:bg-red-200 font-semibold transition-colors"
                  >
                    Suspend User
                  </button>
                ) : (
                  <button
                    onClick={() => onSuspendUser(user._id, false)}
                    className="w-full text-sm bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 font-semibold transition-colors"
                  >
                    Unsuspend User
                  </button>
                )}
              </div>
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


// ─── Shared status helpers ────────────────────────────────────────────────────
const FB_STATUS = {
  pending:    { label: 'Pending',   cls: 'bg-yellow-100 text-yellow-800' },
  'in-review':{ label: 'In Review', cls: 'bg-indigo-100 text-indigo-800' },
  resolved:   { label: 'Resolved',  cls: 'bg-green-100 text-green-800' },
  closed:     { label: 'Closed',    cls: 'bg-gray-100 text-gray-700' },
};

const HD_STATUS = {
  open:        { label: 'Open',        cls: 'bg-blue-100 text-blue-800' },
  'in-progress':{ label: 'In Progress', cls: 'bg-indigo-100 text-indigo-800' },
  resolved:    { label: 'Resolved',    cls: 'bg-green-100 text-green-800' },
  closed:      { label: 'Closed',      cls: 'bg-gray-100 text-gray-700' },
};

const StarRow = ({ rating }) => (
  <span className="flex">
    {[1,2,3,4,5].map(n => (
      <Star key={n} className="w-3.5 h-3.5"
            fill={n <= rating ? '#f59e0b' : 'none'}
            stroke={n <= rating ? '#f59e0b' : '#9ca3af'} strokeWidth={1.5} />
    ))}
  </span>
);

// ─── Feedback Admin Tab ───────────────────────────────────────────────────────
const FeedbackAdminTab = ({ data, loading, page, setPage, status, setStatus, refetch, queryClient }) => {
  const [expanded, setExpanded] = useState(null);
  const [replies, setReplies] = useState({});
  const [updating, setUpdating] = useState(null);

  const handleStatusChange = async (id, newStatus) => {
    setUpdating(id);
    try {
      await api.patch(`/feedback/${id}/status`, { status: newStatus });
      queryClient.invalidateQueries(['admin-feedback']);
      toast.success('Status updated');
    } catch { toast.error('Failed to update status'); }
    finally { setUpdating(null); }
  };

  const handleReply = async (id) => {
    const reply = replies[id]?.trim();
    if (!reply) return toast.error('Reply cannot be empty');
    setUpdating(id);
    try {
      await api.patch(`/feedback/${id}/status`, { adminReply: reply, status: 'resolved' });
      queryClient.invalidateQueries(['admin-feedback']);
      setReplies(r => ({ ...r, [id]: '' }));
      toast.success('Reply sent & status set to Resolved');
    } catch { toast.error('Failed to send reply'); }
    finally { setUpdating(null); }
  };

  const feedbacks = data?.data?.feedbacks || [];
  const totalPages = data?.data?.pages || 1;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter:</span>
        {['', 'pending', 'in-review', 'resolved', 'closed'].map(s => (
          <button key={s} onClick={() => { setStatus(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${status === s ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'}`}>
            {s === '' ? 'All' : FB_STATUS[s]?.label || s}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-500">{data?.data?.total || 0} total</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
      ) : feedbacks.length === 0 ? (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
          <MessageSquarePlus className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No feedback found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {feedbacks.map(fb => (
            <div key={fb._id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Row header */}
              <div className="flex items-start justify-between p-4 gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {fb.user?.photo && fb.user.photo !== 'default-avatar.png'
                    ? <img src={fb.user.photo} alt={fb.user.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                    : <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0 flex items-center justify-center text-sm font-bold text-gray-500">{(fb.user?.name || fb.name || '?')[0].toUpperCase()}</div>
                  }
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{fb.subject}</p>
                    <p className="text-xs text-gray-500 truncate">{fb.user?.name || 'Unknown'} · {fb.user?.email || ''}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <StarRow rating={fb.rating} />
                      <span className="text-xs text-gray-400 capitalize">{fb.category}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${FB_STATUS[fb.status]?.cls || 'bg-gray-100'}`}>
                        {FB_STATUS[fb.status]?.label || fb.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-gray-400">{new Date(fb.createdAt).toLocaleDateString()}</span>
                  <button onClick={() => setExpanded(e => e === fb._id ? null : fb._id)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                    {expanded === fb._id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Expanded detail */}
              <AnimatePresence>
                {expanded === fb._id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-gray-100 dark:border-gray-700">
                    <div className="p-4 space-y-4">
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{fb.message}</p>

                      {fb.adminReply && (
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
                          <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">Your previous reply:</p>
                          <p className="text-sm text-green-800 dark:text-green-300">{fb.adminReply}</p>
                        </div>
                      )}

                      {/* Status + Reply */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        <select
                          value={fb.status}
                          onChange={e => handleStatusChange(fb._id, e.target.value)}
                          disabled={updating === fb._id}
                          className="text-xs border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                        >
                          {Object.entries(FB_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                        <div className="flex flex-1 gap-2">
                          <input
                            type="text"
                            placeholder="Type a reply to the user…"
                            value={replies[fb._id] || ''}
                            onChange={e => setReplies(r => ({ ...r, [fb._id]: e.target.value }))}
                            className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                          />
                          <button
                            onClick={() => handleReply(fb._id)}
                            disabled={updating === fb._id}
                            className="flex items-center gap-1 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Send className="w-3.5 h-3.5" /> Send
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700">Prev</button>
          <span className="px-4 py-1.5 text-sm text-gray-600 dark:text-gray-400">Page {page}/{totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700">Next</button>
        </div>
      )}
    </div>
  );
};

// ─── Help Desk Admin Tab ──────────────────────────────────────────────────────
const HelpDeskAdminTab = ({ data, loading, page, setPage, status, setStatus, refetch, queryClient }) => {
  const [expanded, setExpanded] = useState(null);
  const [replies, setReplies] = useState({});
  const [updating, setUpdating] = useState(null);

  const handleStatusChange = async (id, newStatus) => {
    setUpdating(id);
    try {
      await api.patch(`/helpdesk/${id}`, { status: newStatus });
      queryClient.invalidateQueries(['admin-helpdesk']);
      toast.success('Status updated');
    } catch { toast.error('Failed to update status'); }
    finally { setUpdating(null); }
  };

  const handleReply = async (id) => {
    const reply = replies[id]?.trim();
    if (!reply) return toast.error('Reply cannot be empty');
    setUpdating(id);
    try {
      await api.patch(`/helpdesk/${id}`, { adminReply: reply, status: 'resolved' });
      queryClient.invalidateQueries(['admin-helpdesk']);
      setReplies(r => ({ ...r, [id]: '' }));
      toast.success('Reply saved & ticket resolved');
    } catch { toast.error('Failed to send reply'); }
    finally { setUpdating(null); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this ticket permanently?')) return;
    try {
      await api.delete(`/helpdesk/${id}`);
      queryClient.invalidateQueries(['admin-helpdesk']);
      toast.success('Ticket deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const tickets = data?.data?.tickets || [];
  const totalPages = data?.data?.pages || 1;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter:</span>
        {['', 'open', 'in-progress', 'resolved', 'closed'].map(s => (
          <button key={s} onClick={() => { setStatus(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${status === s ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'}`}>
            {s === '' ? 'All' : HD_STATUS[s]?.label || s}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-500">{data?.data?.total || 0} total</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
          <LifeBuoy className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No tickets found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map(t => (
            <div key={t._id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="flex items-start justify-between p-4 gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 text-sm font-bold text-blue-700 dark:text-blue-400">
                    {(t.name || '?')[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{t.subject}</p>
                    <p className="text-xs text-gray-500 truncate">{t.name} · {t.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${HD_STATUS[t.status]?.cls || 'bg-gray-100'}`}>
                        {HD_STATUS[t.status]?.label || t.status}
                      </span>
                      {t.user && <span className="text-xs text-gray-400">Registered user</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-gray-400">{new Date(t.createdAt).toLocaleDateString()}</span>
                  <button onClick={() => handleDelete(t._id)} className="text-red-400 hover:text-red-600 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setExpanded(e => e === t._id ? null : t._id)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                    {expanded === t._id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {expanded === t._id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-gray-100 dark:border-gray-700">
                    <div className="p-4 space-y-4">
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">{t.message}</p>

                      {t.adminReply && (
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
                          <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">Your previous reply:</p>
                          <p className="text-sm text-green-800 dark:text-green-300">{t.adminReply}</p>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row gap-3">
                        <select
                          value={t.status}
                          onChange={e => handleStatusChange(t._id, e.target.value)}
                          disabled={updating === t._id}
                          className="text-xs border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                        >
                          {Object.entries(HD_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                        <div className="flex flex-1 gap-2">
                          <input
                            type="text"
                            placeholder="Type a reply / internal note…"
                            value={replies[t._id] || ''}
                            onChange={e => setReplies(r => ({ ...r, [t._id]: e.target.value }))}
                            className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                          />
                          <button
                            onClick={() => handleReply(t._id)}
                            disabled={updating === t._id}
                            className="flex items-center gap-1 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Send className="w-3.5 h-3.5" /> Send
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700">Prev</button>
          <span className="px-4 py-1.5 text-sm text-gray-600 dark:text-gray-400">Page {page}/{totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700">Next</button>
        </div>
      )}
    </div>
  );
};

export default Admin;

