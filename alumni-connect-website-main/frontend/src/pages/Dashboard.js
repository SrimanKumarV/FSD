import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, 
  Briefcase, 
  Calendar, 
  MessageSquare, 
  Code, 
  TrendingUp,
  Clock,
  Star,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Info,
  Activity
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import CollegeProfileExtractor from '../components/profile/CollegeProfileExtractor';

const iconMap = {
  Users: Users,
  Briefcase: Briefcase,
  Calendar: Calendar,
  MessageSquare: MessageSquare,
  Info: Info
};

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    stats: [],
    recentActivities: [],
    upcomingEvents: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get('/users/dashboard');
        setDashboardData(response.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const { stats, recentActivities, upcomingEvents } = dashboardData;

  const quickActions = [
    {
      name: 'Find Mentor',
      description: 'Connect with experienced alumni',
      icon: Users,
      href: '/mentorship',
      color: 'alumni'
    },
    {
      name: 'Browse Jobs',
      description: 'Explore career opportunities',
      icon: Briefcase,
      href: '/jobs',
      color: 'student'
    },
    {
      name: 'Join Event',
      description: 'Attend workshops and seminars',
      icon: Calendar,
      href: '/events',
      color: 'primary'
    },
    {
      name: 'Start Discussion',
      description: 'Share your thoughts in forum',
      icon: MessageSquare,
      href: '/forum',
      color: 'success'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
      case 'unread':
        return 'text-yellow-600 bg-yellow-100';
      case 'confirmed':
      case 'read':
        return 'text-green-600 bg-green-100';
      case 'submitted':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'confirmed':
        return <CheckCircle className="w-4 h-4" />;
      case 'submitted':
        return <Info className="w-4 h-4" />;
      case 'unread':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 w-full">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-br from-cyan-600 via-emerald-500 to-cyan-700 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden border border-white/10"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
            Welcome back, {user?.name}!
          </h1>
          <p className="text-cyan-50 text-lg" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
            Here's what's happening in your professional network today.
          </p>
        </div>
      </motion.div>

      {/* College Profile Extractor (Only for College Role) */}
      {user?.role === 'college' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
        >
          <CollegeProfileExtractor />
        </motion.div>
      )}

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {(stats || []).map((stat, index) => {
          const Icon = iconMap[stat.iconName] || Info;
          return (
              <motion.div
              whileHover={{ y: -5, scale: 1.02 }}
              key={stat.name}
              className="glass-card rounded-2xl p-6 relative overflow-hidden group border border-white/5 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)]"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#94a3b8]">{stat.name}</p>
                  <p className="text-4xl font-extrabold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                </div>
                <div className={`p-4 rounded-xl bg-cyan-100 dark:bg-cyan-900/30 shadow-inner`}>
                  <Icon className={`w-7 h-7 text-cyan-600 dark:text-cyan-400`} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="lg:col-span-2 glass-card rounded-2xl overflow-hidden border border-white/5 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)]"
        >
          <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Activity</h2>
          </div>
          <div className="p-8">
            <div className="space-y-6 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
              {(!recentActivities || recentActivities.length === 0) ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Activity className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No recent activity found.</p>
                </div>
              ) : (
                recentActivities.map((activity) => {
                  const Icon = iconMap[activity.iconName] || Info;
                return (
                  <Link to="/notifications" key={activity.id}>
                    <motion.div whileHover={{ x: 5 }} className="flex items-start space-x-4 p-3 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 rounded-xl transition-colors cursor-pointer group">
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center shadow-inner group-hover:bg-cyan-50 dark:group-hover:bg-cyan-900/30 transition-colors">
                          <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-cyan-500 transition-colors" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <p className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">{activity.title}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{activity.description}</p>
                        <div className="mt-3 flex items-center space-x-3 w-full">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                            {getStatusIcon(activity.status)}
                            <span className="ml-1 capitalize">{activity.status}</span>
                          </span>
                          <span className="text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">{activity.time}</span>
                          {activity.status === 'pending' && (
                            <span className="ml-auto text-xs font-bold bg-cyan-600/10 text-cyan-600 hover:bg-cyan-600 hover:text-white px-3 py-1.5 rounded-full transition-colors border border-cyan-600/20">
                              Review
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                );
              }))}
            </div>
            <div className="mt-8">
              <Link to="/notifications" className="block w-full text-center text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-white py-3 border border-primary-200 dark:border-primary-800 rounded-xl hover:bg-primary-600 dark:hover:bg-primary-600 transition-all duration-300">
                View All Activity
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Events */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="glass-card rounded-2xl overflow-hidden border border-white/5 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)]"
          >
            <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Upcoming Events</h2>
            </div>
            <div className="p-8">
              <div className="space-y-5">
                {(!upcomingEvents || upcomingEvents.length === 0) ? (
                  <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                    <Calendar className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-medium mb-4">No upcoming events right now.</p>
                    <Link to="/events" className="inline-block px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-white rounded-lg text-sm font-bold transition-colors">
                      Explore Events
                    </Link>
                  </div>
                ) : (
                  upcomingEvents.map((event) => (
                    <motion.div whileHover={{ x: 5 }} key={event.id} className="flex items-start space-x-4 p-2 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 rounded-xl transition-colors">
                      <div className="flex-shrink-0">
                        <div className="w-3 h-3 bg-primary-500 rounded-full mt-1.5 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{event.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center"><Calendar className="w-3 h-3 mr-1"/> {event.date}</p>
                        <p className="text-xs font-medium text-primary-600 dark:text-primary-400 mt-1">{event.host}</p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
              <div className="mt-6">
                <Link to="/events" className="block w-full text-center text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-white py-3 border border-primary-200 dark:border-primary-800 rounded-xl hover:bg-primary-600 transition-all duration-300">
                  View All Events
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="glass-card rounded-2xl overflow-hidden border border-white/5 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)]"
          >
            <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Quick Actions</h2>
            </div>
            <div className="p-8">
              <div className="space-y-4">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <motion.div whileHover={{ scale: 1.02 }} key={action.name}>
                      <Link
                        to={action.href}
                        className="block w-full text-left px-5 py-4 rounded-xl border border-gray-200/50 dark:border-gray-700/50 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-primary-50/50 dark:hover:bg-primary-900/20 transition-all duration-300 group shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`p-3 rounded-xl bg-${action.color}-100 dark:bg-${action.color}-900/30 group-hover:bg-${action.color}-200 dark:group-hover:bg-${action.color}-800/50 transition-colors`}>
                              <Icon className={`w-6 h-6 text-${action.color}-600 dark:text-${action.color}-400`} />
                            </div>
                            <div className="flex-1 pr-4">
                              <p className="text-sm font-bold text-gray-900 dark:text-white">{action.name}</p>
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">{action.description}</p>
                            </div>
                          </div>
                          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors shrink-0" />
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
