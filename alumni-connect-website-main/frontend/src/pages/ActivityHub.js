import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  CheckCircle2,
  Flame,
  BarChart3,
  Target,
  Link2,
  Clock,
  Settings,
  RefreshCw,
  Plus,
  ChevronRight,
  Shield,
  ShieldCheck,
  AlertTriangle,
  Trophy,
  ExternalLink,
  Edit3,
  Trash2,
  Calendar,
  Check,
  Loader2,
  Sparkles,
  ArrowRight,
  Info,
  Filter,
  Code,
  BookOpen,
  Globe,
  TrendingUp
} from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

// Reusable Activity Intelligence Components
import ActivityMomentumCard from '../components/activity/ActivityMomentumCard';
import TodayGoals from '../components/activity/TodayGoals';
import WeeklyActivityChart from '../components/activity/WeeklyActivityChart';
import ActivityTimeline from '../components/activity/ActivityTimeline';
import ActivityInsight from '../components/activity/ActivityInsight';
import MilestoneTimeline from '../components/activity/MilestoneTimeline';
import PlatformActivityCard from '../components/activity/PlatformActivityCard';
import ActivityHeatmap from '../components/activity/ActivityHeatmap';
import ConsistencyScoreCard from '../components/activity/ConsistencyScoreCard';
import PersonalRecords from '../components/activity/PersonalRecords';
import StreakProtectionCard from '../components/activity/StreakProtectionCard';
import GoalBuilderModal from '../components/activity/GoalBuilderModal';
import ActivitySettings from '../components/activity/ActivitySettings';
import PlatformIcon from '../components/PlatformIcon';

const categoryIcons = {
  coding: Code,
  learning: BookOpen,
  project: Globe,
  career: TrendingUp,
  custom: Target
};

const ActivityHub = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  const [dashboard, setDashboard] = useState(null);
  const [goals, setGoals] = useState([]);
  const [preferences, setPreferences] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsDays, setAnalyticsDays] = useState(180);
  const [loading, setLoading] = useState(true);

  // Modals & Action States
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [refreshingPlatform, setRefreshingPlatform] = useState(null);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState(null);

  // Tab Filtering states
  const [todayFilter, setTodayFilter] = useState('all'); // 'all', 'pending', 'completed'
  const [goalCategoryFilter, setGoalCategoryFilter] = useState('all');

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  // ─── DATA FETCHING ──────────────────────────────────────────

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await api.get('/activity/dashboard');
      setDashboard(res.data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    }
  }, []);

  const fetchGoals = useCallback(async () => {
    try {
      const res = await api.get('/activity/goals');
      setGoals(res.data);
    } catch (err) {
      console.error('Goals fetch error:', err);
    }
  }, []);

  const fetchPreferences = useCallback(async () => {
    try {
      const res = await api.get('/activity/preferences');
      setPreferences(res.data);
    } catch (err) {
      console.error('Preferences fetch error:', err);
    }
  }, []);

  const fetchTimeline = useCallback(async () => {
    try {
      const res = await api.get('/activity/timeline?limit=50');
      setTimeline(res.data?.items || []);
    } catch (err) {
      console.error('Timeline fetch error:', err);
    }
  }, []);

  const fetchAnalytics = useCallback(async (days = 180) => {
    try {
      const res = await api.get(`/activity/analytics?days=${days}`);
      setAnalytics(res.data);
    } catch (err) {
      console.error('Analytics fetch error:', err);
    }
  }, []);

  const reloadAll = useCallback(async () => {
    await Promise.all([
      fetchDashboard(),
      fetchGoals(),
      fetchPreferences(),
      fetchTimeline(),
      fetchAnalytics(analyticsDays)
    ]);
  }, [fetchDashboard, fetchGoals, fetchPreferences, fetchTimeline, fetchAnalytics, analyticsDays]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await reloadAll();
      setLoading(false);
    };
    init();
  }, [reloadAll]);

  // Handle Analytics period change
  const handleRangeChange = (days) => {
    setAnalyticsDays(days);
    fetchAnalytics(days);
  };

  // ─── ACTIONS ────────────────────────────────────────────────

  const handleCompleteGoal = async (goalId) => {
    try {
      const res = await api.post(`/activity/goals/${goalId}/complete`);
      if (res.data?.alreadyCompleted) {
        toast('Already completed today!', { icon: '✅' });
        return;
      }
      toast.success('Goal completed! Keep the momentum! 🎉');
      fetchGoals();
      fetchDashboard();
      fetchTimeline();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete goal');
    }
  };

  const handleSaveGoal = async (goalData) => {
    try {
      if (editingGoal) {
        await api.put(`/activity/goals/${editingGoal._id || editingGoal.id}`, goalData);
        toast.success('Goal updated successfully');
      } else {
        await api.post('/activity/goals', goalData);
        toast.success('Goal created! Happy tracking! 🚀');
      }
      setShowGoalModal(false);
      setEditingGoal(null);
      fetchGoals();
      fetchDashboard();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save goal');
    }
  };

  const handleDeleteGoal = async (goalId) => {
    if (!window.confirm('Delete this goal? Activity history for this goal will also be removed.')) return;
    try {
      await api.delete(`/activity/goals/${goalId}`);
      toast.success('Goal deleted');
      fetchGoals();
      fetchDashboard();
    } catch (err) {
      toast.error('Failed to delete goal');
    }
  };

  const handleRefreshPlatform = async (platform) => {
    setRefreshingPlatform(platform);
    try {
      await api.post(`/activity/integrations/${platform}/refresh`);
      toast.success(`${platform} data refreshed`);
      fetchDashboard();
      fetchTimeline();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to refresh platform');
    } finally {
      setRefreshingPlatform(null);
    }
  };

  const handleSyncAll = async () => {
    setIsSyncingAll(true);
    setSyncFeedback(null);
    try {
      const res = await api.post('/activity/sync');
      const detectedCount = res.data?.activitiesDetected?.length || 0;
      const goalsVerified = res.data?.goalsVerified?.length || 0;
      
      setSyncFeedback({
        detectedCount,
        goalsVerified,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });

      toast.success(`Platform sync complete! (${detectedCount} activities detected)`);

      if (res.data?.summary) {
        setDashboard(res.data.summary);
      } else {
        fetchDashboard();
      }
      fetchGoals();
      fetchTimeline();
    } catch (err) {
      toast.error('Failed to sync platforms');
    } finally {
      setIsSyncingAll(false);
    }
  };

  // ─── TABS DEFINITION ────────────────────────────────────────

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Zap },
    { id: 'today', label: "Today's Plan", icon: CheckCircle2 },
    { id: 'streaks', label: 'Streaks', icon: Flame },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'platforms', label: 'Platforms', icon: Link2 },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // ─── DERIVED VALUES FOR TODAY'S PLAN ────────────────────────

  const todayGoalsList = useMemo(() => {
    return dashboard?.todaysPlan?.goals || goals || [];
  }, [dashboard, goals]);

  const filteredTodayGoals = useMemo(() => {
    return todayGoalsList.filter(g => {
      if (todayFilter === 'pending') return !g?.completedToday;
      if (todayFilter === 'completed') return g?.completedToday;
      return true;
    });
  }, [todayGoalsList, todayFilter]);

  const completedTodayCount = todayGoalsList.filter(g => g.completedToday).length;
  const totalTodayCount = todayGoalsList.length;
  const todayProgressPercent = totalTodayCount > 0 ? Math.round((completedTodayCount / totalTodayCount) * 100) : 0;

  // Top Priority Goal for Overview
  const topPriorityGoal = useMemo(() => {
    return todayGoalsList.find(g => !g.completedToday) || todayGoalsList[0] || null;
  }, [todayGoalsList]);

  // Ranked Categories for Streaks & Overview
  const rankedCategories = useMemo(() => {
    const cats = [
      { key: 'coding', name: 'Coding', icon: Code, color: 'text-blue-500 bg-blue-500/10' },
      { key: 'learning', name: 'Learning', icon: BookOpen, color: 'text-violet-500 bg-violet-500/10' },
      { key: 'project', name: 'Projects', icon: Globe, color: 'text-emerald-500 bg-emerald-500/10' },
      { key: 'career', name: 'Career', icon: TrendingUp, color: 'text-amber-500 bg-amber-500/10' }
    ];

    return cats.map(c => {
      const data = dashboard?.categoryStreaks?.[c.key] || {};
      return {
        ...c,
        current: data.current || 0,
        longest: data.longest || 0,
        activeToday: data.activeToday || false,
        atRisk: data.atRisk || false
      };
    }).sort((a, b) => b.current - a.current);
  }, [dashboard]);

  // Current Local Date String
  const currentDateFormatted = useMemo(() => {
    try {
      const tz = preferences?.timezone || 'Asia/Kolkata';
      return new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        timeZone: tz
      }).format(new Date());
    } catch {
      return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    }
  }, [preferences?.timezone]);

  // ─── LOADING STATE ──────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mx-auto" />
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Loading Activity Intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* ── TOP HEADER / OPERATING SYSTEM SHELL ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200/50 dark:border-gray-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white flex items-center gap-2.5">
            <Zap className="w-7 h-7 text-amber-500 fill-amber-500" />
            <span>Activity Intelligence</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Automated tracking, streak intelligence & career momentum
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSyncAll}
            disabled={isSyncingAll}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-all active:scale-95 shadow-sm"
            title="Scan connected accounts for new activity"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin text-indigo-500' : ''}`} />
            <span>{isSyncingAll ? 'Syncing...' : 'Sync Platforms'}</span>
          </button>

          <button
            onClick={() => {
              setEditingGoal(null);
              setShowGoalModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Goal</span>
          </button>
        </div>
      </div>

      {/* Sync Feedback Banner (Contextual) */}
      {syncFeedback && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>
              <strong>Sync Complete:</strong> {syncFeedback.detectedCount} new activit{syncFeedback.detectedCount === 1 ? 'y' : 'ies'} detected across connected accounts at {syncFeedback.timestamp}.
            </span>
          </div>
          <button
            onClick={() => setSyncFeedback(null)}
            className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
          >
            Dismiss
          </button>
        </motion.div>
      )}

      {/* ── NAVIGATION RAIL (8 TABS) ── */}
      <div className="flex gap-1.5 p-1.5 bg-gray-100 dark:bg-gray-800/60 rounded-2xl overflow-x-auto custom-scrollbar">
        {tabs.map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => handleTabChange(t.id)}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════
          TAB 1: OVERVIEW — PERSONAL ACTIVITY CONTROL CENTER
         ══════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Section: Today Hero & Progress */}
          <div className="glass-card rounded-2xl p-6 border border-gray-200/50 dark:border-gray-800 bg-gradient-to-br from-indigo-900/10 via-purple-900/5 to-transparent">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Personal Activity Pulse</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                  Good day, {user?.name?.split(' ')[0] || 'Friend'} 👋
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xl">
                  {dashboard?.overallStreak?.current > 0
                    ? `Your activity is on track. ${dashboard?.overallStreak?.current}-day momentum is building.`
                    : 'Start your daily consistency today. Every verified action builds momentum.'}
                </p>

                <div className="flex items-center gap-3 pt-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-black">
                    <Flame className="w-4 h-4 fill-amber-500" />
                    <span>{dashboard?.overallStreak?.current || 0} day streak</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    Best: {dashboard?.overallStreak?.longest || 0} days
                  </span>
                </div>
              </div>

              {/* Today's Progress Box */}
              <div className="p-4 rounded-xl bg-white dark:bg-gray-800/80 border border-gray-200/60 dark:border-gray-700/60 min-w-[260px] space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-600 dark:text-gray-300">Today's Progress</span>
                  <span className="font-extrabold text-indigo-600 dark:text-indigo-400">
                    {completedTodayCount} / {totalTodayCount} goals
                  </span>
                </div>

                <div className="w-full bg-gray-100 dark:bg-gray-700 h-2.5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${todayProgressPercent}%` }}
                    transition={{ duration: 0.7 }}
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full"
                  />
                </div>

                <button
                  onClick={() => handleTabChange('today')}
                  className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
                >
                  <span>Continue Today's Plan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Section: This Week Consistency (Sunday first) */}
          <div className="glass-card rounded-2xl p-6 border border-gray-200/50 dark:border-gray-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  <span>This Week Consistency</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Daily activity rhythm starting on Sunday
                </p>
              </div>
              <button
                onClick={() => handleTabChange('analytics')}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <span>Full Analytics</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <WeeklyActivityChart weeklyData={dashboard?.weekly} onDayClick={() => handleTabChange('analytics')} />
          </div>

          {/* 2-Column: Current Momentum Areas & Today's Priority */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Ranked Momentum Areas */}
            <div className="lg:col-span-6 glass-card rounded-2xl p-6 border border-gray-200/50 dark:border-gray-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-500" />
                  <span>Current Momentum</span>
                </h3>
                <button
                  onClick={() => handleTabChange('streaks')}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <span>Streak Center</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2.5">
                {rankedCategories.map(cat => {
                  const Icon = cat.icon;
                  return (
                    <div
                      key={cat.key}
                      className="p-3 rounded-xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-200/40 dark:border-gray-700/40 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-lg ${cat.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-gray-900 dark:text-white block">
                            {cat.name}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            {cat.activeToday ? 'Active today' : cat.current > 0 ? 'Pending today' : 'Not started'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {cat.current > 0 ? (
                          <span className="flex items-center gap-1 text-xs font-extrabold text-amber-500">
                            <Flame className="w-3.5 h-3.5 fill-amber-500" />
                            {cat.current} days
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 font-semibold">— 0 days</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Today's Priority & Behavioral Insights */}
            <div className="lg:col-span-6 space-y-6">
              {/* Today's Priority Card */}
              <div className="glass-card rounded-2xl p-6 border border-gray-200/50 dark:border-gray-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                    <span>Today's Priority</span>
                  </h3>
                  <button
                    onClick={() => handleTabChange('today')}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <span>View Full Plan</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {topPriorityGoal ? (
                  <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/50 dark:border-indigo-800/40 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => !topPriorityGoal.completedToday && handleCompleteGoal(topPriorityGoal._id || topPriorityGoal.id)}
                        disabled={topPriorityGoal.completedToday}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                          topPriorityGoal.completedToday
                            ? 'bg-emerald-500 text-white shadow-sm'
                            : 'border-2 border-indigo-400 text-transparent hover:text-indigo-600 hover:border-indigo-600'
                        }`}
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                      </button>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-extrabold ${topPriorityGoal.completedToday ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                            {topPriorityGoal.title}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Verified</span>
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {topPriorityGoal.target || '1 activity'} • {topPriorityGoal.platform || topPriorityGoal.category}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleTabChange('today')}
                      className="px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 text-xs font-bold border border-gray-200 dark:border-gray-700 hover:bg-gray-50"
                    >
                      Open
                    </button>
                  </div>
                ) : (
                  <div className="py-6 text-center text-gray-400 text-xs">
                    <p>You have no active goals configured for today.</p>
                    <button
                      onClick={() => setShowGoalModal(true)}
                      className="mt-2 text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                    >
                      + Create a Goal
                    </button>
                  </div>
                )}
              </div>

              {/* Momentum Insight Banner */}
              <div className="glass-card rounded-2xl p-5 border border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/10">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Momentum Insight</span>
                </h4>
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                  💡 {dashboard?.insights?.[0]?.message || 'Coding is your strongest area this week. Maintain daily consistency to lock in your next milestone.'}
                </p>
              </div>
            </div>
          </div>

          {/* Section: Recent Activity Timeline Snippet */}
          <div className="glass-card rounded-2xl p-6 border border-gray-200/50 dark:border-gray-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  <span>Recent Activity Records</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Verified platform events and habit completions
                </p>
              </div>

              <button
                onClick={() => handleTabChange('timeline')}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <span>View Full Timeline</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <ActivityTimeline items={dashboard?.recentActivity || []} isCompact={true} />
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB 2: TODAY'S PLAN — WHAT SHOULD I DO TODAY?
         ══════════════════════════════════════════════════════════ */}
      {activeTab === 'today' && (
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6 border border-gray-200/50 dark:border-gray-800 space-y-6">
            {/* Header: Date & Timezone */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  {currentDateFormatted}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mt-0.5">
                  Today's Action Plan
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Operating in timezone: <strong className="text-gray-700 dark:text-gray-300">{preferences?.timezone || 'Asia/Kolkata'}</strong>
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingGoal(null);
                  setShowGoalModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Add Goal</span>
              </button>
            </div>

            {/* Progress Rail */}
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-gray-600 dark:text-gray-300">Today's Progress</span>
                <span className="text-indigo-600 dark:text-indigo-400">{completedTodayCount} / {totalTodayCount} completed ({todayProgressPercent}%)</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${todayProgressPercent}%` }}
                  transition={{ duration: 0.6 }}
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full"
                />
              </div>
            </div>

            {/* Segmented Filter Controls */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex gap-1.5 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'pending', label: 'Incomplete' },
                  { id: 'completed', label: 'Completed' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setTodayFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      todayFilter === tab.id
                        ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <span className="text-xs text-gray-400">
                {filteredTodayGoals.length} {filteredTodayGoals.length === 1 ? 'goal' : 'goals'} listed
              </span>
            </div>

            {/* Today's Goals List with Priority System */}
            {filteredTodayGoals.length > 0 ? (
              <div className="space-y-3">
                {filteredTodayGoals.map(goal => {
                  const isCompleted = goal.completedToday;
                  const CategoryIcon = categoryIcons[goal.category] || Target;
                  const isAtRisk = goal.atRisk || (!isCompleted && (goal.currentStreak || 0) > 0);

                  return (
                    <motion.div
                      key={goal._id || goal.id}
                      layout
                      className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        isCompleted
                          ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/30'
                          : isAtRisk
                          ? 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/30 shadow-sm'
                          : 'bg-white dark:bg-gray-800/60 border-gray-200/60 dark:border-gray-700/60'
                      }`}
                    >
                      {/* Left: Complete Checkbox & Details */}
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          onClick={() => !isCompleted && handleCompleteGoal(goal._id || goal.id)}
                          disabled={isCompleted}
                          title={isCompleted ? 'Completed' : 'Click to complete'}
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
                            isCompleted
                              ? 'bg-emerald-500 text-white cursor-default shadow-md shadow-emerald-500/20'
                              : 'border-2 border-gray-300 dark:border-gray-600 hover:border-indigo-500 text-transparent hover:text-indigo-500'
                          }`}
                        >
                          <Check className={`w-4 h-4 stroke-[3] ${isCompleted ? 'text-white' : 'text-current'}`} />
                        </button>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-sm font-bold truncate ${isCompleted ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                              {goal.title}
                            </span>

                            {/* Trust Badge */}
                            {isCompleted ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                <ShieldCheck className="w-3 h-3" />
                                <span>Verified</span>
                              </span>
                            ) : goal.trackingMode === 'automatic' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                                <Zap className="w-2.5 h-2.5 text-amber-500" />
                                <span>Auto Track</span>
                              </span>
                            ) : null}

                            {/* Streak at Risk Indicator */}
                            {!isCompleted && isAtRisk && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Streak at Risk</span>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {goal.platform && goal.platform !== 'custom' ? (
                              <span className="flex items-center gap-1 capitalize">
                                <PlatformIcon platform={goal.platform} className="w-3.5 h-3.5" />
                                <span>{goal.platform}</span>
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 capitalize">
                                <CategoryIcon className="w-3.5 h-3.5" />
                                <span>{goal.category}</span>
                              </span>
                            )}

                            {goal.target && <span>• {goal.target}</span>}
                            {goal.estimatedMinutes && <span>• {goal.estimatedMinutes}m</span>}
                          </div>
                        </div>
                      </div>

                      {/* Right: Streak & Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {(goal.currentStreak || 0) > 0 && (
                          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold">
                            <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                            <span>{goal.currentStreak}d</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              /* Intelligent Empty / Finished State */
              <div className="py-12 text-center space-y-3 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl p-6">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-extrabold text-gray-900 dark:text-white">
                  {totalTodayCount > 0 ? "You're clear for today! 🎉" : "No goals configured for today"}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                  {totalTodayCount > 0
                    ? `All daily priorities completed! Your next milestone is a ${dashboard?.overallStreak?.milestones?.next || 7}-day streak.`
                    : 'Create your first daily goal or connect developer accounts to verify your progress.'}
                </p>
                {totalTodayCount > 0 ? (
                  <button
                    onClick={() => handleTabChange('streaks')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    <span>View Streaks</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => setShowGoalModal(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Goal</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB 3: STREAKS — STREAK CENTER & CONSISTENCY
         ══════════════════════════════════════════════════════════ */}
      {activeTab === 'streaks' && (
        <div className="space-y-6">
          {/* Top: Streak Center Hero */}
          <div className="glass-card rounded-2xl p-6 border border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-transparent to-purple-500/5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Streak Center
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mt-1">
                  Your consistency at a glance
                </h2>
                <div className="mt-3 flex items-baseline gap-2">
                  <Flame className="w-8 h-8 text-amber-500 fill-amber-500 animate-pulse" />
                  <span className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white">
                    {dashboard?.overallStreak?.current ?? 0}
                  </span>
                  <span className="text-base font-bold text-gray-500 uppercase tracking-widest">
                    DAYS
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Current overall consistency streak across all verified activities
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 min-w-[240px]">
                <div className="p-3.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200/60 dark:border-gray-700/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Best Streak</span>
                  <p className="text-lg font-black text-gray-900 dark:text-white mt-0.5">
                    {dashboard?.overallStreak?.longest ?? 0} days
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200/60 dark:border-gray-700/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Today's State</span>
                  <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
                    {dashboard?.overallStreak?.activeToday ? 'Protected' : 'Pending'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Streak Protection Panel */}
          <StreakProtectionCard
            overallStreak={dashboard?.overallStreak}
            categoryStreaks={dashboard?.categoryStreaks}
            timezone={preferences?.timezone}
          />

          {/* Milestone Timeline */}
          <MilestoneTimeline
            milestoneData={dashboard?.overallStreak?.milestones}
            currentStreak={dashboard?.overallStreak?.current}
          />

          {/* Ranked Category Streaks (Clean list rather than 5 huge cards) */}
          <div className="glass-card rounded-2xl p-6 border border-gray-200/50 dark:border-gray-800 space-y-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500" />
                <span>Your Areas of Momentum</span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Streaks ranked by active consistency
              </p>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {rankedCategories.map(cat => {
                const Icon = cat.icon;
                return (
                  <div key={cat.key} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${cat.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-gray-900 dark:text-white block">
                          {cat.name}
                        </span>
                        <span className="text-xs text-gray-400">
                          Best: {cat.longest} days
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        cat.activeToday
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                      }`}>
                        {cat.activeToday ? 'Active today' : 'Pending'}
                      </span>

                      <div className="flex items-center gap-1 font-black text-sm text-gray-900 dark:text-white min-w-[70px] justify-end">
                        <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <span>{cat.current} days</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Connected Platform Momentum */}
          {(dashboard?.integrations?.platforms || []).length > 0 && (
            <div className="glass-card rounded-2xl p-6 border border-gray-200/50 dark:border-gray-800 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-2">
                <Link2 className="w-4 h-4 text-indigo-500" />
                <span>Connected Platform Momentum</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(dashboard?.integrations?.platforms || []).map(p => (
                  <div
                    key={p.platform}
                    className="p-3.5 rounded-xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-200/40 dark:border-gray-700/40 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <PlatformIcon platform={p.platform} className="w-5 h-5 flex-shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-gray-900 dark:text-white block capitalize">
                          {p.platform}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {p.username ? `@${p.username}` : 'Connected'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-black text-amber-500">
                      <Flame className="w-3.5 h-3.5 fill-amber-500" />
                      <span>{p.currentStreak || 0}d</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Personal Records */}
          <PersonalRecords records={dashboard?.personalRecords} />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB 4: ANALYTICS — PROFESSIONAL ACTIVITY ANALYTICS
         ══════════════════════════════════════════════════════════ */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Header & Range Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                Activity Analytics
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Understand your habit trends, consistency index, and yearly patterns.
              </p>
            </div>

            {/* Range Selector: 7D, 30D, 90D, 1Y */}
            <div className="flex gap-1.5 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
              {[
                { days: 7, label: '7D' },
                { days: 30, label: '30D' },
                { days: 90, label: '90D' },
                { days: 180, label: '6M' },
                { days: 365, label: '1Y' },
              ].map(opt => (
                <button
                  key={opt.days}
                  onClick={() => handleRangeChange(opt.days)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    analyticsDays === opt.days
                      ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Primary Charts & Consistency */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-6">
              <WeeklyActivityChart weeklyData={analytics?.weekly || dashboard?.weekly} />
              <ConsistencyScoreCard consistencyData={analytics?.consistency || dashboard?.consistency} />
            </div>

            <div className="lg:col-span-5 space-y-6">
              <PersonalRecords records={dashboard?.personalRecords} />

              <div className="glass-card rounded-2xl p-5 border border-indigo-500/20 bg-indigo-500/5 dark:bg-indigo-500/10 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Consistency Index Breakdown</span>
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                  Your consistency index factors <strong>Active Days (50%)</strong>, <strong>Goal Completion (30%)</strong>, and <strong>Streak Length (20%)</strong> over the active evaluation window.
                </p>
              </div>
            </div>
          </div>

          {/* Full Activity Heatmap with Sunday-first day labels */}
          <ActivityHeatmap heatmapData={analytics?.heatmap} />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB 5: GOALS — HABIT GOAL MANAGEMENT
         ══════════════════════════════════════════════════════════ */}
      {activeTab === 'goals' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                Goal Management
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Build habits that compound through automated platform tracking and daily focus.
              </p>
            </div>

            <button
              onClick={() => {
                setEditingGoal(null);
                setShowGoalModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>New Goal</span>
            </button>
          </div>

          {/* Summary Bar */}
          <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-4 text-gray-600 dark:text-gray-300">
              <span><strong>{goals.length}</strong> active goals</span>
              <span>•</span>
              <span className="text-emerald-600 dark:text-emerald-400"><strong>{completedTodayCount}</strong> completed today</span>
              <span>•</span>
              <span className="text-amber-600 dark:text-amber-400"><strong>{Math.max(goals.length - completedTodayCount, 0)}</strong> pending</span>
            </div>
          </div>

          {/* Goal Cards Grid */}
          {goals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {goals.map(goal => {
                const CategoryIcon = categoryIcons[goal.category] || Target;
                const isCompleted = goal.completedToday;

                return (
                  <div
                    key={goal._id}
                    className="glass-card rounded-2xl p-5 border border-gray-200/50 dark:border-gray-800 flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 capitalize">
                          {goal.category}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{goal.reminderTime || '20:00'}</span>
                        </div>
                      </div>

                      <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <span>{goal.title}</span>
                        {isCompleted && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </h4>

                      {goal.target && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Target: {goal.target}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-2 text-[11px] text-gray-500 dark:text-gray-400 mt-3">
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 capitalize">
                          Tracking: {goal.trackingMode || 'manual'}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 capitalize">
                          Frequency: {goal.frequency}
                        </span>
                        {goal.platform && goal.platform !== 'custom' && (
                          <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 capitalize flex items-center gap-1">
                            <PlatformIcon platform={goal.platform} className="w-3 h-3" />
                            <span>{goal.platform}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500">
                        <Flame className="w-4 h-4 fill-amber-500" />
                        <span>{goal.currentStreak || 0}d streak</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingGoal(goal);
                            setShowGoalModal(true);
                          }}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          title="Edit Goal"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteGoal(goal._id)}
                          className="p-1.5 text-gray-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                          title="Delete Goal"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center space-y-3 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl p-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 flex items-center justify-center mx-auto">
                <Target className="w-6 h-6" />
              </div>
              <h4 className="text-base font-extrabold text-gray-900 dark:text-white">No goals yet</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                Create your first activity goal and start building career momentum through automated tracking.
              </p>
              <button
                onClick={() => setShowGoalModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Create Goal</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB 6: PLATFORMS — CONNECTED DEVELOPER ACCOUNTS
         ══════════════════════════════════════════════════════════ */}
      {activeTab === 'platforms' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                Connected Platforms
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Activity is automatically verified from your connected developer accounts.
              </p>
            </div>

            <button
              onClick={handleSyncAll}
              disabled={isSyncingAll}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
              <span>{isSyncingAll ? 'Syncing...' : 'Sync All Now'}</span>
            </button>
          </div>

          {/* Platform Rows Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(dashboard?.integrations?.platforms || []).map(p => (
              <PlatformActivityCard
                key={p.platform}
                platform={p}
                onRefresh={handleRefreshPlatform}
                isRefreshing={refreshingPlatform === p.platform}
              />
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB 7: TIMELINE — CHRONOLOGICAL ACTIVITY AUDIT
         ══════════════════════════════════════════════════════════ */}
      {activeTab === 'timeline' && (
        <div className="glass-card rounded-2xl p-6 border border-gray-200/50 dark:border-gray-800 space-y-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
              Activity Timeline
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Everything Alumnex has verified about your activity across developer platforms and habit completions.
            </p>
          </div>

          <ActivityTimeline items={timeline} showFilters={true} />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB 8: SETTINGS — COMPLETE ACTIVITY PREFERENCES CENTER
         ══════════════════════════════════════════════════════════ */}
      {activeTab === 'settings' && (
        <ActivitySettings
          initialPreferences={preferences}
          onPreferencesSaved={() => {
            fetchPreferences();
            fetchDashboard();
          }}
          onDataReset={() => {
            reloadAll();
          }}
          onOpenPlatforms={() => handleTabChange('platforms')}
        />
      )}

      {/* ── GOAL BUILDER MODAL ── */}
      <GoalBuilderModal
        isOpen={showGoalModal}
        onClose={() => {
          setShowGoalModal(false);
          setEditingGoal(null);
        }}
        onSave={handleSaveGoal}
        initialGoal={editingGoal}
      />
    </div>
  );
};

export default ActivityHub;
