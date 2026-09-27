import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';

// Activity Intelligence Components
import ActivityMomentumCard from '../../components/activity/ActivityMomentumCard';
import TodayGoals from '../../components/activity/TodayGoals';
import StreakList from '../../components/activity/StreakList';
import WeeklyActivityChart from '../../components/activity/WeeklyActivityChart';
import ActivityTimeline from '../../components/activity/ActivityTimeline';
import ActivityInsight from '../../components/activity/ActivityInsight';

const StitchDashboard = () => {
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
      const res = await api.get('/users/dashboard');
      setDashboardData(res.data);
    } catch (e) {
      console.error('Failed to load dashboard data:', e);
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
      toast.error('Platform sync failed. Showing cached data.');
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
        notes: 'Completed from Stitch Dashboard'
      });
      toast.success(res.data.message || 'Goal marked complete! Streak extended 🔥');
      await fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to complete goal');
    }
  };

  const { upcomingEvents, activity } = dashboardData;

  const quickActions = [
    { name: 'Activity Hub', icon: '🔥', href: '/activity', desc: 'Streaks, analytics & planner', gradient: 'from-amber-500 to-rose-600' },
    { name: 'DevPulse', icon: '⚡', href: '/devpulse', desc: 'Developer profile & stats', gradient: 'from-blue-600 to-indigo-600' },
    { name: 'Find Mentor', icon: '🎓', href: '/mentorship', desc: 'Connect with alumni', gradient: 'from-violet-600 to-purple-700' },
    { name: 'Browse Jobs', icon: '💼', href: '/jobs', desc: 'Explore opportunities', gradient: 'from-emerald-500 to-teal-600' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-2 border-transparent border-t-blue-500 border-r-violet-500 animate-spin" />
          <p className="text-sm font-medium text-slate-400">Loading Activity Intelligence...</p>
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
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">

      {/* Hero Greeting & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Welcome back, <span style={{ background: 'linear-gradient(135deg,#60a5fa,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{user?.name?.split(' ')[0] || 'there'}</span> 👋
          </h1>
          <p className="mt-1 text-sm md:text-base font-medium" style={{ color: 'rgba(241,245,249,0.60)' }}>
            Your personal career momentum center. Everything you learn and build fuels your streak.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSyncPlatforms}
            disabled={syncing}
            className="glass-card px-4 py-2.5 rounded-full flex items-center gap-2 text-xs md:text-sm font-medium text-white hover:bg-white/10 transition-colors"
          >
            <span className={`material-symbols-outlined text-sm ${syncing ? 'animate-spin' : ''}`}>sync</span>
            {syncing ? 'Syncing...' : 'Sync Platforms'}
          </button>
          <Link
            to="/activity"
            className="px-4 py-2.5 rounded-full text-xs md:text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-transform hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
          >
            Open Hub →
          </Link>
        </div>
      </div>

      {/* LEVEL 1: MY MOMENTUM HERO CARD */}
      <ActivityMomentumCard
        activityData={activity}
        streakData={overallStreak}
        todayData={todayData}
        userName={user?.name}
        onOpenPlan={() => {
          const el = document.getElementById('stitch-todays-plan');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* THREE STATS PILLS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Overall Streak</p>
            <p className="text-3xl font-extrabold text-white mt-1">
              {overallStreak.current || 0} <span className="text-xs text-slate-400 font-normal">days</span>
            </p>
            <p className="text-xs text-amber-400 font-medium mt-1">
              {overallStreak.activeToday ? '✓ Active today' : '🔥 Streak at risk'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xl text-amber-400">
            🔥
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Today's Progress</p>
            <p className="text-3xl font-extrabold text-white mt-1">
              {todayData.completedGoalsCount || 0} / {todayData.totalGoalsCount || 0}
            </p>
            <p className="text-xs text-emerald-400 font-medium mt-1">
              {todayData.remainingCount === 0 && todayData.totalGoalsCount > 0 ? 'All finished today!' : `${todayData.remainingCount || 0} remaining`}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xl text-emerald-400">
            🎯
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Weekly Consistency</p>
            <p className="text-3xl font-extrabold text-white mt-1">
              {weeklyData.activeDays || 0} <span className="text-xs text-slate-400 font-normal">/ 7 days</span>
            </p>
            <p className="text-xs text-blue-400 font-medium mt-1">
              {weeklyData.comparisonVsLastWeek !== null 
                ? `${weeklyData.comparisonVsLastWeek >= 0 ? '+' : ''}${weeklyData.comparisonVsLastWeek}% vs last week`
                : `${weeklyData.totalActivities || 0} events`}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-xl text-blue-400">
            📈
          </div>
        </div>
      </div>

      {/* LEVEL 2 & 3: TODAY'S PLAN + WEEKLY ACTIVITY & STREAKS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column (2 cols): Today's Plan & Charts */}
        <div id="stitch-todays-plan" className="lg:col-span-2 space-y-6">
          <TodayGoals
            goals={todaysGoals}
            onToggleGoal={handleToggleGoal}
            onOpenHub={() => window.location.href = '/activity?tab=goals'}
            compact={true}
          />

          {/* Weekly Activity Chart */}
          <WeeklyActivityChart weeklyData={weeklyData} />

          {/* Activity Timeline */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>⏱️</span> Activity Timeline
              </h3>
              <Link to="/activity?tab=timeline" className="text-xs font-semibold text-blue-400 hover:underline">
                View all →
              </Link>
            </div>
            <ActivityTimeline timeline={activityTimeline} compact={true} />
          </div>
        </div>

        {/* Right Column: Streaks, Insight, Connected Platforms, Quick Actions */}
        <div className="space-y-6">
          {/* Active Streaks */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>🔥</span> Active Streaks
              </h3>
              <Link to="/activity?tab=streaks" className="text-xs font-semibold text-blue-400 hover:underline">
                Explore →
              </Link>
            </div>
            <StreakList streaks={streaksData} compact={true} />
          </div>

          {/* Behavioral Insight */}
          <ActivityInsight insights={insights} />

          {/* Connected Platforms */}
          {platforms && platforms.length > 0 && (
            <div className="glass-card rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Platforms</h4>
                <Link to="/activity?tab=platforms" className="text-xs text-blue-400 hover:underline">
                  Manage
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {platforms.slice(0, 4).map((p) => (
                  <div key={p.id} className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2.5">
                    <span className="text-lg">{p.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate">{p.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {p.connected ? (p.activityToday ? '✓ Active today' : 'Synced') : 'Unlinked'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Compact Upcoming Event */}
          <div className="glass-card rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Upcoming Event</h4>
              <Link to="/events" className="text-xs text-blue-400 hover:underline">Events →</Link>
            </div>
            {(!upcomingEvents || upcomingEvents.length === 0) ? (
              <p className="text-xs text-slate-500 py-2">No upcoming events scheduled right now.</p>
            ) : (
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <p className="text-sm font-bold text-white line-clamp-1">{upcomingEvents[0].title}</p>
                <p className="text-xs text-slate-400 mt-1">📅 {upcomingEvents[0].date}</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="glass-card rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Quick Actions</h4>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => (
                <Link
                  key={action.name}
                  to={action.href}
                  className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all flex flex-col items-start gap-1 group"
                >
                  <span className="text-xl group-hover:scale-110 transition-transform">{action.icon}</span>
                  <span className="text-xs font-bold text-white">{action.name}</span>
                  <span className="text-[10px] text-slate-400 line-clamp-1">{action.desc}</span>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default StitchDashboard;

