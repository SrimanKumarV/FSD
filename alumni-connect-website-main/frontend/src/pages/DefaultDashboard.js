import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, 
  Briefcase, 
  Calendar, 
  Clock, 
  Activity,
  Flame,
  Target,
  TrendingUp,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import toast from 'react-hot-toast';
import CollegeProfileExtractor from '../components/profile/CollegeProfileExtractor';

// Activity Intelligence Components
import ActivityMomentumCard from '../components/activity/ActivityMomentumCard';
import TodayGoals from '../components/activity/TodayGoals';
import StreakList from '../components/activity/StreakList';
import WeeklyActivityChart from '../components/activity/WeeklyActivityChart';
import ActivityTimeline from '../components/activity/ActivityTimeline';
import ActivityInsight from '../components/activity/ActivityInsight';
import PlatformActivityCard from '../components/activity/PlatformActivityCard';

const DefaultDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    stats: [],
    recentActivities: [],
    upcomingEvents: [],
    activity: null
  });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleSyncPlatforms = async () => {
    setSyncing(true);
    try {
      const res = await api.post('/activity/sync');
      toast.success(res.data.message || 'Platforms synchronized!');
      await fetchDashboardData();
    } catch (error) {
      toast.error('Platform sync failed. Using cached data.');
    } finally {
      setSyncing(false);
    }
  };

  const handleToggleGoal = async (goalId, isCompleted) => {
    if (isCompleted) {
      toast('Goal is already completed today!', { icon: '✅' });
      return;
    }
    try {
      const res = await api.post(`/activity/goals/${goalId}/complete`, {
        notes: 'Completed from Dashboard'
      });
      toast.success(res.data.message || 'Goal marked complete! Streak updated 🔥');
      await fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to complete goal');
    }
  };

  const { upcomingEvents, activity } = dashboardData;

  const quickActions = [
    {
      name: 'Activity Hub',
      description: 'Streaks, analytics & goal planner',
      icon: Flame,
      href: '/activity',
      color: 'primary'
    },
    {
      name: 'DevPulse',
      description: 'Developer identity & platform cards',
      icon: Activity,
      href: '/devpulse',
      color: 'student'
    },
    {
      name: 'Find Mentor',
      description: 'Connect with experienced alumni',
      icon: Users,
      href: '/mentorship',
      color: 'alumni'
    },
    {
      name: 'Browse Jobs',
      description: 'Explore verified career opportunities',
      icon: Briefcase,
      href: '/jobs',
      color: 'student'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="text-sm font-medium text-gray-500">Loading your Activity Intelligence...</p>
        </div>
      </div>
    );
  }

  const overallStreak = activity?.overallStreak || { current: 0, longest: 0, activeToday: false };
  const todayData = {
    completedGoalsCount: activity?.today?.completedGoalsCount ?? activity?.today?.completedGoals ?? 0,
    totalGoalsCount: activity?.today?.totalGoalsCount ?? activity?.today?.totalGoals ?? 0,
    remainingCount: activity?.today?.remainingCount ?? activity?.today?.remainingGoals ?? 0
  };
  const rawPlan = activity?.todaysPlan;
  const todaysGoals = Array.isArray(rawPlan)
    ? rawPlan
    : Array.isArray(rawPlan?.goals)
    ? rawPlan.goals
    : [];
  const streaksData = activity?.streaks || { 
    overall: overallStreak, 
    categories: activity?.categoryStreaks || {}, 
    platforms: activity?.integrations?.platforms || [] 
  };
  const weeklyData = activity?.weekly || { totalActivities: 0, activeDays: 0, days: [], comparisonVsLastWeek: null };
  const insights = Array.isArray(activity?.insights) ? activity.insights : [];
  const activityTimeline = Array.isArray(activity?.recentActivity) 
    ? activity.recentActivity 
    : Array.isArray(activity?.recentActivity?.items) 
    ? activity.recentActivity.items 
    : [];
  const platforms = Array.isArray(activity?.platforms) 
    ? activity.platforms 
    : Array.isArray(activity?.integrations?.platforms) 
    ? activity.integrations.platforms 
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 w-full pb-16">
      
      {/* LEVEL 1: MY MOMENTUM HERO & TOP METRICS */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
              Good day, {user?.name?.split(' ')[0] || 'Friend'} <span className="inline-block animate-pulse">👋</span>
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-medium mt-1">
              Your career momentum at a glance. Every commit, problem solved, and study session counts.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSyncPlatforms}
              disabled={syncing}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-primary-500' : 'text-gray-400'}`} />
              {syncing ? 'Syncing...' : 'Sync Platforms'}
            </button>
            <Link
              to="/activity"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-primary-600 hover:bg-primary-700 text-white shadow-md shadow-primary-500/20 transition-all"
            >
              Activity Hub <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* HERO MOMENTUM CARD */}
        <ActivityMomentumCard
          activityData={activity}
          streakData={overallStreak}
          todayData={todayData}
          userName={user?.name}
          onOpenPlan={() => {
            const el = document.getElementById('todays-plan-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* THREE MINI METRIC PILLS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Activity Streak</p>
              <p className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">
                {overallStreak.current || 0} <span className="text-xs font-medium text-gray-500">days</span>
              </p>
              <p className="text-xs text-amber-500 font-medium mt-1">
                {overallStreak.activeToday ? '✓ Active today' : '🔥 Incomplete today'}
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Flame className="w-6 h-6" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Today's Goals</p>
              <p className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">
                {todayData.completedGoalsCount || 0} / {todayData.totalGoalsCount || 0}
              </p>
              <p className="text-xs text-emerald-500 font-medium mt-1">
                {todayData.remainingCount === 0 && todayData.totalGoalsCount > 0 
                  ? 'All goals achieved!' 
                  : `${todayData.remainingCount || 0} remaining`}
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Target className="w-6 h-6" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Weekly Consistency</p>
              <p className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">
                {weeklyData.activeDays || 0} <span className="text-xs font-medium text-gray-500">/ 7 days</span>
              </p>
              <p className="text-xs text-primary-500 font-medium mt-1">
                {weeklyData.comparisonVsLastWeek !== null 
                  ? `${weeklyData.comparisonVsLastWeek >= 0 ? '+' : ''}${weeklyData.comparisonVsLastWeek}% vs last week`
                  : `${weeklyData.totalActivities || 0} total events`}
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-primary-500/10 flex items-center justify-center text-primary-500">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>
      </section>

      {/* College Profile Extractor (Role specific) */}
      {user?.role === 'college' && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
          <CollegeProfileExtractor />
        </motion.div>
      )}

      {/* LEVEL 2 & 3: TODAY'S PLAN (GOALS) & STREAKS + WEEKLY ACTIVITY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col (2 cols span): TODAY'S PLAN */}
        <div id="todays-plan-section" className="lg:col-span-2 space-y-6">
          <TodayGoals
            goals={todaysGoals}
            onToggleGoal={handleToggleGoal}
            onOpenHub={() => window.location.href = '/activity?tab=goals'}
            compact={true}
          />

          {/* WEEKLY ACTIVITY VISUALIZATION */}
          <WeeklyActivityChart weeklyData={weeklyData} />

          {/* RECENT ACTIVITY TIMELINE */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary-500" />
                Recent Activity Timeline
              </h3>
              <Link to="/activity?tab=timeline" className="text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400">
                Full timeline →
              </Link>
            </div>
            <ActivityTimeline timeline={activityTimeline} compact={true} />
          </div>
        </div>

        {/* Right Col: STREAKS, INSIGHTS & ECOSYSTEM */}
        <div className="space-y-6">
          {/* YOUR STREAKS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500" />
                Active Streaks
              </h3>
              <Link to="/activity?tab=streaks" className="text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400">
                View all →
              </Link>
            </div>
            <StreakList streaks={streaksData} compact={true} />
          </div>

          {/* BEHAVIORAL INSIGHT */}
          <ActivityInsight insights={insights} />

          {/* CONNECTED PLATFORMS STATUS */}
          {platforms && platforms.length > 0 && (
            <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/80 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Connected Platforms</h4>
                <Link to="/activity?tab=platforms" className="text-xs font-semibold text-primary-500 hover:underline">
                  Manage
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {platforms.slice(0, 4).map((p) => (
                  <div key={p.id} className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 flex items-center gap-2.5">
                    <span className="text-lg">{p.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{p.name}</p>
                      <p className="text-[10px] text-gray-400 truncate">
                        {p.connected ? (p.activityToday ? '✓ Active today' : 'Connected') : 'Not linked'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* UPCOMING EVENTS (COMPACT) */}
          <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/80 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary-500" />
                Upcoming Event
              </h4>
              <Link to="/events" className="text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400">
                All events →
              </Link>
            </div>
            {(!upcomingEvents || upcomingEvents.length === 0) ? (
              <p className="text-xs text-gray-400 py-2">No upcoming events scheduled right now.</p>
            ) : (
              <div className="p-3 rounded-xl bg-primary-50/50 dark:bg-primary-950/20 border border-primary-100 dark:border-primary-900/30">
                <p className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">{upcomingEvents[0].title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-primary-500" /> {upcomingEvents[0].date}
                </p>
              </div>
            )}
          </div>

          {/* QUICK ACTIONS */}
          <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/80 shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Quick Navigation</h4>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.name}
                    to={action.href}
                    className="p-3 rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-gray-900/40 dark:hover:bg-gray-800/80 border border-gray-100 dark:border-gray-800 transition-all flex flex-col items-start gap-1 group"
                  >
                    <Icon className="w-4 h-4 text-primary-500 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-gray-900 dark:text-white">{action.name}</span>
                    <span className="text-[10px] text-gray-400 line-clamp-1">{action.description}</span>
                  </Link>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DefaultDashboard;

