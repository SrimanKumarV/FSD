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
  ArrowRight,
  Flame,
  Sparkles
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
import TodayScheduleWidget from '../components/dashboard/TodayScheduleWidget';
import { checkAndTriggerStreakPushNotification } from '../utils/streakPushNotification';

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
      if (response.data?.activity) {
        checkAndTriggerStreakPushNotification(response.data.activity, user?.timezone);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.timezone]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const { stats, recentActivities, upcomingEvents, activity } = dashboardData;

  const quickActions = [
    {
      name: 'Find Mentors',
      description: 'Connect with alumni in your field',
      icon: Users,
      href: '/mentorship',
      color: 'indigo'
    },
    {
      name: 'Browse Jobs',
      description: 'Explore verified career openings',
      icon: Briefcase,
      href: '/jobs',
      color: 'blue'
    },
    {
      name: 'Join Events',
      description: 'Workshops, webinars & meetups',
      icon: Calendar,
      href: '/events',
      color: 'emerald'
    },
    {
      name: 'Start Discussion',
      description: 'Share insights in community forum',
      icon: MessageSquare,
      href: '/forum',
      color: 'purple'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
      case 'unread':
        return 'text-amber-700 bg-amber-100/80 dark:bg-amber-950/40 dark:text-amber-400';
      case 'confirmed':
      case 'read':
        return 'text-emerald-700 bg-emerald-100/80 dark:bg-emerald-950/40 dark:text-emerald-400';
      case 'submitted':
        return 'text-blue-700 bg-blue-100/80 dark:bg-blue-950/40 dark:text-blue-400';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-3.5 h-3.5" />;
      case 'confirmed':
        return <CheckCircle className="w-3.5 h-3.5" />;
      case 'submitted':
        return <Info className="w-3.5 h-3.5" />;
      case 'unread':
        return <AlertCircle className="w-3.5 h-3.5" />;
      default:
        return <Info className="w-3.5 h-3.5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const currentStreak = activity?.overallStreak?.current || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 w-full pb-10 min-w-0">
      {/* 1. Header & Greeting (Streamlined First Viewport) */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="glass-card rounded-2xl p-5 sm:p-6 bg-gradient-to-r from-primary-600 via-indigo-600 to-indigo-700 text-white shadow-md relative overflow-hidden border border-white/15"
      >
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-200">
                Alumnex Connect
              </span>
              {currentStreak > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-bold backdrop-blur-xs">
                  <Flame className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                  <span>{currentStreak} day streak</span>
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-indigo-100 text-xs sm:text-sm mt-0.5 max-w-xl">
              Here is your professional network and momentum overview for today.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/activity"
              className="px-4 py-2 rounded-xl bg-white text-primary-700 hover:bg-indigo-50 font-bold text-xs sm:text-sm shadow-xs transition-colors"
            >
              Activity Hub
            </Link>
            <Link
              to="/network"
              className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm backdrop-blur-xs transition-colors"
            >
              Network
            </Link>
          </div>
        </div>
      </motion.div>

      {/* College Profile Extractor (If applicable) */}
      {user?.role === 'college' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <CollegeProfileExtractor />
        </motion.div>
      )}

      {/* 2. Today's Priorities: Next Best Action & Schedule Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-w-0 items-start">
        <div className="lg:col-span-2 min-w-0">
          <NextBestAction
            user={user}
            activity={activity}
            recentActivities={recentActivities}
            upcomingEvents={upcomingEvents}
          />
        </div>
        <div className="lg:col-span-1 min-w-0">
          <TodayScheduleWidget />
        </div>
      </div>

      {/* 3. Key Metrics Grid (Proportional & Compact) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 min-w-0">
        {(stats || []).map((stat) => {
          const Icon = iconMap[stat.iconName] || Info;
          return (
            <motion.div
              whileHover={{ y: -2 }}
              key={stat.name}
              className="glass-card rounded-2xl p-4 sm:p-5 border border-gray-200/70 dark:border-gray-800 flex flex-col justify-between shadow-xs transition-all duration-200 min-w-0"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 truncate">
                  {stat.name}
                </span>
                <div className="w-8 h-8 rounded-xl bg-primary-50 dark:bg-primary-950/40 border border-primary-100 dark:border-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                {stat.value}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* 4. Streak At Risk Banner (Conditional) & Activity Momentum */}
      <DashboardMomentumInsight activity={activity} />
      <ActivityMomentumBanner activity={activity} userName={user?.name} />

      {/* 5. Activity Intelligence: Today's Goals & Weekly Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-w-0">
        <div className="lg:col-span-2 min-w-0">
          <DashboardWeeklyActivity activity={activity} />
        </div>
        <div className="lg:col-span-1 min-w-0">
          <DashboardTodayGoals 
            activity={activity} 
            onGoalCompleted={() => fetchDashboardData()} 
          />
        </div>
      </div>

      {/* 6. Streaks Row */}
      <div className="w-full min-w-0">
        <DashboardStreaks activity={activity} />
      </div>

      {/* 7. Network Feed, Upcoming Events & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-w-0">
        {/* Recent Activity (Left 2 cols) */}
        <div className="lg:col-span-2 glass-card rounded-2xl overflow-hidden border border-gray-200/70 dark:border-gray-800 flex flex-col justify-between min-w-0">
          <div>
            <div className="p-4 sm:p-5 border-b border-gray-200/60 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Activity className="w-4 h-4" />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                  Recent Activity
                </h2>
              </div>
              <Link 
                to="/notifications" 
                className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 transition-colors"
              >
                View all
              </Link>
            </div>

            <div className="p-4 sm:p-5">
              <div className="space-y-3 max-h-[340px] overflow-y-auto custom-scrollbar pr-1">
                {(!recentActivities || recentActivities.length === 0) ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Activity className="w-8 h-8 mx-auto mb-2 opacity-30 text-gray-400" />
                    <p className="text-xs sm:text-sm">No recent activity found.</p>
                  </div>
                ) : (
                  recentActivities.map((activityItem) => {
                    const Icon = iconMap[activityItem.iconName] || Info;
                    return (
                      <Link 
                        to="/notifications" 
                        key={activityItem.id}
                        className="flex items-start gap-3 p-3 hover:bg-gray-50/70 dark:hover:bg-gray-800/40 rounded-xl transition-colors cursor-pointer group border border-transparent hover:border-gray-200/60 dark:hover:border-gray-700/50"
                      >
                        <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0 group-hover:bg-primary-50 dark:group-hover:bg-primary-950/40 text-gray-600 dark:text-gray-400 group-hover:text-primary-600 transition-colors">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors truncate">
                            {activityItem.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                            {activityItem.description}
                          </p>
                          <div className="mt-2 flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(activityItem.status)}`}>
                              {getStatusIcon(activityItem.status)}
                              <span className="capitalize">{activityItem.status}</span>
                            </span>
                            <span className="text-xs text-gray-400">
                              {activityItem.time}
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions (Right 1 col) */}
        <div className="lg:col-span-1 glass-card rounded-2xl overflow-hidden border border-gray-200/70 dark:border-gray-800 flex flex-col justify-between min-w-0">
          <div>
            <div className="p-4 sm:p-5 border-b border-gray-200/60 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
                  <ArrowRight className="w-4 h-4" />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                  Quick Actions
                </h2>
              </div>
            </div>

            <div className="p-4 sm:p-5 space-y-2.5">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.name}
                    to={action.href}
                    className="block w-full p-3 rounded-xl border border-gray-200/70 dark:border-gray-800 hover:border-primary-400 dark:hover:border-primary-600 hover:bg-primary-50/40 dark:hover:bg-primary-950/20 transition-all duration-200 group shadow-xs hover:no-underline"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/40 text-gray-600 dark:text-gray-300 group-hover:text-primary-600 transition-colors flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
                            {action.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {action.description}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600 transition-colors shrink-0" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 8. Upcoming Events Section */}
      <div className="glass-card rounded-2xl overflow-hidden border border-gray-200/70 dark:border-gray-800 min-w-0">
        <div className="p-4 sm:p-5 border-b border-gray-200/60 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
              Upcoming Events
            </h2>
          </div>
          <Link to="/events" className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline">
            View all
          </Link>
        </div>

        <div className="p-4 sm:p-5">
          {(!upcomingEvents || upcomingEvents.length === 0) ? (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30 text-gray-400" />
              <p className="text-xs sm:text-sm font-medium mb-3">No upcoming events scheduled right now.</p>
              <Link 
                to="/events" 
                className="inline-block px-4 py-2 bg-primary-50 dark:bg-primary-950/50 hover:bg-primary-100 text-primary-700 dark:text-primary-300 rounded-xl text-xs sm:text-sm font-bold transition-colors"
              >
                Explore events
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {upcomingEvents.map((event) => (
                <div 
                  key={event.id} 
                  className="p-3.5 rounded-xl border border-gray-200/70 dark:border-gray-800 hover:border-primary-300 dark:hover:border-primary-700/60 transition-colors flex items-start gap-3 bg-white/50 dark:bg-gray-800/30"
                >
                  <div className="w-2.5 h-2.5 bg-primary-500 rounded-full mt-1.5 shrink-0"></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
                      {event.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3 shrink-0" />
                      <span>{event.date}</span>
                    </p>
                    <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 mt-1 truncate">
                      {event.host}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DefaultDashboard;
