import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, 
  Briefcase, 
  Calendar, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Activity,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import CollegeProfileExtractor from '../components/profile/CollegeProfileExtractor';

// Activity Intelligence Components
import ActivityMomentumBanner from '../components/activity/ActivityMomentumBanner';
import DashboardTodayGoals from '../components/activity/DashboardTodayGoals';
import DashboardStreaks from '../components/activity/DashboardStreaks';
import DashboardWeeklyActivity from '../components/activity/DashboardWeeklyActivity';
import DashboardMomentumInsight from '../components/activity/DashboardMomentumInsight';
import NextBestAction from '../components/dashboard/NextBestAction';

const iconMap = {
  Users: Users,
  Briefcase: Briefcase,
  Calendar: Calendar,
  MessageSquare: MessageSquare,
  Info: Info
};

const DefaultDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    stats: [],
    recentActivities: [],
    upcomingEvents: [],
    activity: null
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await api.get('/users/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const { stats, recentActivities, upcomingEvents, activity } = dashboardData;

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 w-full pb-12">
      {/* 1. Welcome Header (Existing) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden border border-white/10"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-violet-400/20 rounded-full blur-2xl translate-y-1/2 pointer-events-none"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2 tracking-tight" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.25)' }}>
            Welcome back, {user?.name}!
          </h1>
          <p className="text-indigo-100 text-lg font-medium" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.15)' }}>
            Here's what's happening in your professional network and personal momentum today.
          </p>
        </div>
      </motion.div>

      {/* College Profile Extractor (Only for College Role - Existing) */}
      {user?.role === 'college' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
        >
          <CollegeProfileExtractor />
        </motion.div>
      )}

      {/* 2. Intelligent Next Best Action Engine (Personalized Daily Directive) */}
      <NextBestAction
        user={user}
        activity={activity}
        recentActivities={recentActivities}
        upcomingEvents={upcomingEvents}
      />

      {/* 3. Stats Grid: Mentorship, Jobs, Events, Forum (Existing) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {(stats || []).map((stat) => {
          const Icon = iconMap[stat.iconName] || Info;
          return (
            <motion.div
              whileHover={{ y: -5, scale: 1.02 }}
              key={stat.name}
              className="glass-card rounded-2xl p-6 relative overflow-hidden group border border-white/5 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)]"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/20 to-transparent dark:from-indigo-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#94a3b8]">{stat.name}</p>
                  <p className="text-4xl font-extrabold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                </div>
                <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-500/20 shadow-inner">
                  <Icon className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* 3. Streak At Risk / Momentum Insight Banner (Conditional) */}
      <DashboardMomentumInsight activity={activity} />

      {/* 4. PRIMARY SECTION: MY MOMENTUM (New Activity Intelligence Bridge) */}
      <ActivityMomentumBanner activity={activity} userName={user?.name} />

      {/* 5. Row 1: Recent Activity (Existing) + Today's Goals (Activity Intelligence) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 cols): Existing Recent Activity Platform/Social Feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="lg:col-span-2 glass-card rounded-2xl overflow-hidden border border-white/5 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex flex-col justify-between"
        >
          <div>
            <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                  <Activity className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Activity</h2>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold">
                Network & System
              </span>
            </div>
            <div className="p-6">
              <div className="space-y-4 max-h-[360px] overflow-y-auto custom-scrollbar pr-2">
                {(!recentActivities || recentActivities.length === 0) ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No recent network activity found.</p>
                  </div>
                ) : (
                  recentActivities.map((activityItem) => {
                    const Icon = iconMap[activityItem.iconName] || Info;
                    return (
                      <Link to="/notifications" key={activityItem.id}>
                        <motion.div whileHover={{ x: 5 }} className="flex items-start space-x-4 p-3 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 rounded-xl transition-colors cursor-pointer group">
                          <div className="flex-shrink-0 mt-1">
                            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center shadow-inner group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/40 transition-colors">
                              <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-indigo-500 transition-colors" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <p className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{activityItem.title}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{activityItem.description}</p>
                            <div className="mt-3 flex items-center space-x-3 w-full">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activityItem.status)}`}>
                                {getStatusIcon(activityItem.status)}
                                <span className="ml-1 capitalize">{activityItem.status}</span>
                              </span>
                              <span className="text-xs font-medium text-gray-500 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">{activityItem.time}</span>
                              {activityItem.status === 'pending' && (
                                <span className="ml-auto text-xs font-bold bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white px-3 py-1.5 rounded-full transition-colors border border-indigo-600/20">
                                  Review
                                </span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          </div>
          <div className="p-6 pt-0">
            <Link to="/notifications" className="block w-full text-center text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-white py-2.5 border border-primary-200 dark:border-primary-800 rounded-xl hover:bg-primary-600 dark:hover:bg-primary-600 transition-all duration-300 hover:no-underline">
              View All Network Activity
            </Link>
          </div>
        </motion.div>

        {/* Right (1 col): Today's Goals (Activity Intelligence) */}
        <DashboardTodayGoals 
          activity={activity} 
          onGoalCompleted={() => fetchDashboardData()} 
        />
      </div>

      {/* 6. Row 2: Activity This Week + Your Streaks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 cols): Weekly Activity Chart */}
        <div className="lg:col-span-2">
          <DashboardWeeklyActivity activity={activity} />
        </div>

        {/* Right (1 col): Category and Platform Streaks */}
        <div className="lg:col-span-1">
          <DashboardStreaks activity={activity} />
        </div>
      </div>

      {/* 7. Row 3: Upcoming Events (Existing) + Quick Actions (Existing) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="glass-card rounded-2xl overflow-hidden border border-white/5 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex flex-col justify-between"
        >
          <div>
            <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Upcoming Events</h2>
              </div>
              <Link to="/events" className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline">
                View all →
              </Link>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {(!upcomingEvents || upcomingEvents.length === 0) ? (
                  <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                    <Calendar className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-medium mb-3">No upcoming events right now.</p>
                    <Link to="/events" className="inline-block px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-white rounded-lg text-sm font-bold transition-colors hover:no-underline">
                      Explore Events
                    </Link>
                  </div>
                ) : (
                  upcomingEvents.map((event) => (
                    <motion.div whileHover={{ x: 5 }} key={event.id} className="flex items-start space-x-4 p-3 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 rounded-xl transition-colors">
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
            </div>
          </div>
          <div className="p-6 pt-0">
            <Link to="/events" className="block w-full text-center text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-white py-2.5 border border-primary-200 dark:border-primary-800 rounded-xl hover:bg-primary-600 transition-all duration-300 hover:no-underline">
              View All Events
            </Link>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="glass-card rounded-2xl overflow-hidden border border-white/5 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex flex-col justify-between"
        >
          <div>
            <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                  <ArrowRight className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Quick Actions</h2>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <motion.div whileHover={{ scale: 1.01 }} key={action.name}>
                      <Link
                        to={action.href}
                        className="block w-full text-left px-4 py-3 rounded-xl border border-gray-200/50 dark:border-gray-700/50 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-primary-50/50 dark:hover:bg-primary-900/20 transition-all duration-300 group shadow-sm hover:no-underline"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2.5 rounded-xl bg-${action.color}-100 dark:bg-${action.color}-900/30 group-hover:bg-${action.color}-200 dark:group-hover:bg-${action.color}-800/50 transition-colors`}>
                              <Icon className={`w-5 h-5 text-${action.color}-600 dark:text-${action.color}-400`} />
                            </div>
                            <div className="flex-1 pr-2">
                              <p className="text-sm font-bold text-gray-900 dark:text-white">{action.name}</p>
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">{action.description}</p>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors shrink-0" />
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DefaultDashboard;
