import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame, Target, Code, BookOpen, Trophy, Plus, Check, X, RefreshCw,
  ExternalLink, Settings, Trash2, Edit3, Clock, Bell, BellOff,
  ChevronDown, Calendar, Zap, Award, AlertTriangle, Link2, CheckCircle2,
  Loader2, Globe, BarChart3, TrendingUp, ChevronRight, Shield, Layers
} from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

// Reusable Activity Intelligence Components
import ActivityMomentumCard from '../components/activity/ActivityMomentumCard';
import StreakList from '../components/activity/StreakList';
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

const ActivityHub = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [goals, setGoals] = useState([]);
  const [preferences, setPreferences] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Modals & Actions
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showPrefsModal, setShowPrefsModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [refreshingPlatform, setRefreshingPlatform] = useState(null);
  const [isSyncingAll, setIsSyncingAll] = useState(false);

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
      const res = await api.get('/activity/timeline?limit=30');
      setTimeline(res.data?.items || []);
    } catch (err) {
      console.error('Timeline fetch error:', err);
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await api.get('/activity/analytics?days=180');
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
      fetchAnalytics()
    ]);
  }, [fetchDashboard, fetchGoals, fetchPreferences, fetchTimeline, fetchAnalytics]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await reloadAll();
      setLoading(false);
    };
    init();
  }, [reloadAll]);

  // ─── ACTIONS ────────────────────────────────────────────────

  const handleCompleteGoal = async (goalId) => {
    try {
      const res = await api.post(`/activity/goals/${goalId}/complete`);
      if (res.data.alreadyCompleted) {
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
    try {
      const res = await api.post('/activity/sync');
      toast.success(`Platform sync complete! (${res.data?.activitiesDetected?.length || 0} activities detected)`);
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

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    try {
      await api.put('/activity/preferences', preferences);
      toast.success('Preferences updated');
      setShowPrefsModal(false);
      fetchPreferences();
      fetchDashboard();
    } catch (err) {
      toast.error('Failed to update preferences');
    }
  };

  const handleDeleteAllData = async () => {
    if (!window.confirm('CAUTION: Are you sure you want to permanently delete all your activity history and goals? This action cannot be undone.')) return;
    try {
      await api.delete('/activity/data');
      toast.success('All activity data reset');
      reloadAll();
      setShowPrefsModal(false);
    } catch (err) {
      toast.error('Failed to reset activity data');
    }
  };

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

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Zap },
    { id: 'today', label: 'Today\'s Plan', icon: CheckCircle2 },
    { id: 'streaks', label: 'Streaks', icon: Flame },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'platforms', label: 'Platforms', icon: Link2 },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* ── TOP HEADER / SYNC BANNER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2.5">
            <Zap className="w-7 h-7 text-amber-500 fill-amber-500" />
            <span>Activity Intelligence</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Automated platform tracking, streak intelligence, and personalized career momentum.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSyncAll}
            disabled={isSyncingAll}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-100 transition-all active:scale-95 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
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

      {/* ── NAVIGATION TABS ── */}
      <div className="flex gap-1.5 p-1.5 bg-gray-100 dark:bg-gray-800/60 rounded-2xl overflow-x-auto custom-scrollbar">
        {tabs.map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
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

      {/* ── TAB 1: OVERVIEW ── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Hero Momentum Card */}
          <ActivityMomentumCard
            activityData={dashboard}
            userName={user?.name}
            onContinuePlan={() => setActiveTab('today')}
          />

          {/* Quick Streak Cards */}
          <StreakList
            overallStreak={dashboard?.overallStreak}
            categoryStreaks={dashboard?.categoryStreaks}
            integrations={dashboard?.integrations}
            isCompact={false}
          />

          {/* 2-Column: Today's Plan & Weekly Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                  <span>Today's Priority Plan</span>
                </h3>
                <button
                  onClick={() => setActiveTab('today')}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <span>View Full Checklist</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <TodayGoals
                goals={dashboard?.todaysPlan?.goals || []}
                onCompleteGoal={handleCompleteGoal}
                onOpenCreateGoal={() => {
                  setEditingGoal(null);
                  setShowGoalModal(true);
                }}
                maxDisplay={4}
              />
            </div>

            <div className="lg:col-span-5 space-y-6">
              <WeeklyActivityChart
                weeklyData={dashboard?.weekly}
                onDayClick={() => setActiveTab('analytics')}
              />

              {/* Behavioral Insights Snippet */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">Momentum Insights</h4>
                <ActivityInsight insights={dashboard?.insights} isCompact={true} />
              </div>
            </div>
          </div>

          {/* Recent Activity Timeline Preview */}
          <div className="glass-card rounded-2xl p-6 border border-gray-200/50 dark:border-gray-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-500" />
                <span>Recent Activity Records</span>
              </h3>
              <button
                onClick={() => setActiveTab('timeline')}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <span>Full Timeline</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <ActivityTimeline items={dashboard?.recentActivity || []} isCompact={true} />
          </div>
        </div>
      )}

      {/* ── TAB 2: TODAY'S PLAN ── */}
      {activeTab === 'today' && (
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6 border border-gray-200/50 dark:border-gray-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">Today's Action Plan</h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Complete your daily priorities or let connected platforms verify your coding automatically.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingGoal(null);
                  setShowGoalModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Add Goal</span>
              </button>
            </div>

            <TodayGoals
              goals={dashboard?.todaysPlan?.goals || []}
              onCompleteGoal={handleCompleteGoal}
              onOpenCreateGoal={() => {
                setEditingGoal(null);
                setShowGoalModal(true);
              }}
              showFilters={true}
            />
          </div>
        </div>
      )}

      {/* ── TAB 3: STREAKS ── */}
      {activeTab === 'streaks' && (
        <div className="space-y-6">
          <StreakProtectionCard
            overallStreak={dashboard?.overallStreak}
            categoryStreaks={dashboard?.categoryStreaks}
            timezone={preferences?.timezone}
          />

          <MilestoneTimeline
            milestoneData={dashboard?.overallStreak?.milestones}
            currentStreak={dashboard?.overallStreak?.current}
          />

          <StreakList
            overallStreak={dashboard?.overallStreak}
            categoryStreaks={dashboard?.categoryStreaks}
            integrations={dashboard?.integrations}
            isCompact={false}
          />

          <PersonalRecords records={dashboard?.personalRecords} />
        </div>
      )}

      {/* ── TAB 4: ANALYTICS ── */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-6">
              <WeeklyActivityChart weeklyData={analytics?.weekly || dashboard?.weekly} />
              <ConsistencyScoreCard consistencyData={analytics?.consistency || dashboard?.consistency} />
            </div>

            <div className="lg:col-span-5 space-y-6">
              <PersonalRecords records={dashboard?.personalRecords} />
            </div>
          </div>

          {/* Full Activity Heatmap */}
          <ActivityHeatmap heatmapData={analytics?.heatmap} />
        </div>
      )}

      {/* ── TAB 5: GOALS MANAGEMENT ── */}
      {activeTab === 'goals' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">All Configured Goals</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Manage, edit, or configure tracking modes for your personal habit goals.
              </p>
            </div>

            <button
              onClick={() => {
                setEditingGoal(null);
                setShowGoalModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>New Goal</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.map(goal => (
              <div
                key={goal._id}
                className="glass-card rounded-2xl p-5 border border-gray-200/50 dark:border-gray-800 flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 capitalize">
                      {goal.category}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{goal.reminderTime || '20:00'}</span>
                    </div>
                  </div>

                  <h4 className="text-base font-bold text-gray-900 dark:text-white">{goal.title}</h4>
                  {goal.target && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Target: {goal.target}</p>
                  )}

                  <div className="flex flex-wrap gap-2 text-[11px] text-gray-500 dark:text-gray-400 mt-3">
                    <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 capitalize">
                      Tracking: {goal.trackingMode || 'manual'}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 capitalize">
                      Frequency: {goal.frequency}
                    </span>
                    {goal.platform && goal.platform !== 'custom' && (
                      <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 capitalize">
                        Platform: {goal.platform}
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
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 6: PLATFORMS ── */}
      {activeTab === 'platforms' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">Connected Platforms</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Automatically verify commits, solved problems, and lessons across your developer accounts.
              </p>
            </div>

            <button
              onClick={handleSyncAll}
              disabled={isSyncingAll}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider shadow-md"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
              <span>{isSyncingAll ? 'Syncing...' : 'Sync All Now'}</span>
            </button>
          </div>

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

      {/* ── TAB 7: TIMELINE ── */}
      {activeTab === 'timeline' && (
        <div className="glass-card rounded-2xl p-6 border border-gray-200/50 dark:border-gray-800 space-y-6">
          <div>
            <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">Activity Timeline</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Complete chronological audit of your verified platform events, manual completions, and milestones.
            </p>
          </div>

          <ActivityTimeline items={timeline} />
        </div>
      )}

      {/* ── TAB 8: SETTINGS & REMINDERS ── */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl space-y-6">
          <div className="glass-card rounded-2xl p-6 border border-gray-200/50 dark:border-gray-800 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Reminder & Timezone Preferences</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Customize when and how Alumnex alerts you to maintain consistency without spam.
              </p>
            </div>

            <form onSubmit={handleSavePreferences} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                  Daily Reminder Time
                </label>
                <input
                  type="time"
                  value={preferences?.reminderTime || '20:00'}
                  onChange={e => setPreferences(prev => ({ ...prev, reminderTime: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                  Your Timezone (IANA)
                </label>
                <input
                  type="text"
                  value={preferences?.timezone || 'Asia/Kolkata'}
                  onChange={e => setPreferences(prev => ({ ...prev, timezone: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
                <p className="text-[11px] text-gray-400 mt-1">Used to accurately calculate streaks without UTC day shift.</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <label className="flex items-center gap-2 p-3 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences?.inAppEnabled !== false}
                    onChange={e => setPreferences(prev => ({ ...prev, inAppEnabled: e.target.checked }))}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">In-App Alerts</span>
                </label>

                <label className="flex items-center gap-2 p-3 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences?.emailEnabled !== false}
                    onChange={e => setPreferences(prev => ({ ...prev, emailEnabled: e.target.checked }))}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Email Digests</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
              >
                Save Preferences
              </button>
            </form>
          </div>

          {/* Privacy Zone */}
          <div className="glass-card rounded-2xl p-6 border border-rose-500/20 bg-rose-500/5 dark:bg-rose-500/10 space-y-3">
            <h4 className="text-sm font-bold text-rose-600 dark:text-rose-400">Data Privacy & Reset</h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              You own all your activity records. You can permanently delete your tracked streaks, records, and goals at any time.
            </p>
            <button
              onClick={handleDeleteAllData}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              Delete All Activity Data
            </button>
          </div>
        </div>
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
