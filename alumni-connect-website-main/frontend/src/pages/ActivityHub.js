import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame, Target, Code, BookOpen, Trophy, Plus, Check, X, RefreshCw,
  ExternalLink, Settings, Trash2, Edit3, Clock, Bell, BellOff,
  ChevronDown, Calendar, Zap, Award, AlertTriangle, Link2, CheckCircle2,
  Loader2, Globe, BarChart3, TrendingUp, ChevronRight
} from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

// ─── PLATFORM ICONS ─────────────────────────────────────────────
const platformIcons = {
  github: '💻', leetcode: '🔥', duolingo: '🌍', hackerrank: '🏅',
  codechef: '👨‍🍳', codeforces: '⚡', gfg: '📗', kaggle: '📊', custom: '🎯'
};

const platformColors = {
  github: '#24292e', leetcode: '#f89f1b', duolingo: '#58cc02', hackerrank: '#2ec866',
  codechef: '#5b4638', codeforces: '#1f8acb', gfg: '#2f8d46', kaggle: '#20beff',
  custom: '#6366f1'
};

const categoryIcons = {
  coding: <Code className="w-4 h-4" />,
  learning: <BookOpen className="w-4 h-4" />,
  career: <TrendingUp className="w-4 h-4" />,
  project: <Globe className="w-4 h-4" />,
  custom: <Target className="w-4 h-4" />
};

// ─── MAIN COMPONENT ─────────────────────────────────────────────
const ActivityHub = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [goals, setGoals] = useState([]);
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showPrefsModal, setShowPrefsModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [refreshingPlatform, setRefreshingPlatform] = useState(null);

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

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchDashboard(), fetchGoals(), fetchPreferences()]);
      setLoading(false);
    };
    loadAll();
  }, [fetchDashboard, fetchGoals, fetchPreferences]);

  // ─── ACTIONS ────────────────────────────────────────────────
  const handleCompleteGoal = async (goalId) => {
    try {
      const res = await api.post(`/activity/goals/${goalId}/complete`);
      if (res.data.alreadyCompleted) {
        toast('Already completed today!', { icon: '✅' });
        return;
      }
      toast.success('Goal completed! 🎉');
      fetchGoals();
      fetchDashboard();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete goal');
    }
  };

  const handleDeleteGoal = async (goalId) => {
    if (!window.confirm('Delete this goal? Activity records will also be removed.')) return;
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
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to refresh');
    } finally {
      setRefreshingPlatform(null);
    }
  };

  // ─── LOADING STATE ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading Activity Hub...</p>
        </div>
      </div>
    );
  }

  // ─── RENDER ─────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 p-6 sm:p-8 text-white"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
                <Zap className="w-7 h-7 text-amber-300" />
                Activity Hub
              </h1>
              <p className="mt-1 text-indigo-100 text-sm sm:text-base">
                Build your skills. Maintain your streaks. Stay career-ready.
              </p>
            </div>
            <button
              onClick={() => setShowPrefsModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium transition-all backdrop-blur-sm"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Preferences</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <StatCard
          icon={<Flame className="w-5 h-5 text-orange-500" />}
          label="Current Streak"
          value={`${dashboard?.currentStreak || 0} days`}
          color="orange"
        />
        <StatCard
          icon={<Target className="w-5 h-5 text-indigo-500" />}
          label="Today's Goals"
          value={`${dashboard?.todaysGoals?.completed || 0} / ${dashboard?.todaysGoals?.total || 0}`}
          color="indigo"
        />
        <StatCard
          icon={<Code className="w-5 h-5 text-emerald-500" />}
          label="Coding"
          value={`${dashboard?.coding?.completed || 0} done`}
          color="emerald"
        />
        <StatCard
          icon={<BookOpen className="w-5 h-5 text-blue-500" />}
          label="Learning"
          value={`${dashboard?.learning?.completed || 0} done`}
          color="blue"
        />
        <StatCard
          icon={<Trophy className="w-5 h-5 text-amber-500" />}
          label="Longest Streak"
          value={`${dashboard?.longestStreak || 0} days`}
          color="amber"
          className="col-span-2 sm:col-span-1"
        />
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800/50 rounded-xl overflow-x-auto">
        {[
          { id: 'overview', label: 'Today\'s Checklist', icon: <CheckCircle2 className="w-4 h-4" /> },
          { id: 'platforms', label: 'Platforms', icon: <Link2 className="w-4 h-4" /> },
          { id: 'goals', label: 'All Goals', icon: <Target className="w-4 h-4" /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <TodaysChecklist
              goals={goals}
              onComplete={handleCompleteGoal}
              onAddGoal={() => setShowGoalModal(true)}
            />
          </motion.div>
        )}
        {activeTab === 'platforms' && (
          <motion.div
            key="platforms"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <PlatformCards
              integrations={dashboard?.integrations}
              onRefresh={handleRefreshPlatform}
              refreshing={refreshingPlatform}
            />
          </motion.div>
        )}
        {activeTab === 'goals' && (
          <motion.div
            key="goals"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <GoalsList
              goals={goals}
              onComplete={handleCompleteGoal}
              onEdit={(g) => { setEditingGoal(g); setShowGoalModal(true); }}
              onDelete={handleDeleteGoal}
              onAddGoal={() => setShowGoalModal(true)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      {showGoalModal && (
        <GoalModal
          goal={editingGoal}
          onClose={() => { setShowGoalModal(false); setEditingGoal(null); }}
          onSaved={() => { fetchGoals(); fetchDashboard(); setShowGoalModal(false); setEditingGoal(null); }}
        />
      )}
      {showPrefsModal && (
        <PreferencesModal
          preferences={preferences}
          onClose={() => setShowPrefsModal(false)}
          onSaved={(p) => { setPreferences(p); setShowPrefsModal(false); }}
        />
      )}
    </div>
  );
};

// ─── STAT CARD ──────────────────────────────────────────────────
const StatCard = ({ icon, label, value, color, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className={`glass-card p-4 rounded-xl border border-gray-200/50 dark:border-gray-700/50 ${className}`}
  >
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg bg-${color}-50 dark:bg-${color}-900/20`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</p>
        <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  </motion.div>
);

// ─── TODAY'S CHECKLIST ──────────────────────────────────────────
const TodaysChecklist = ({ goals, onComplete, onAddGoal }) => {
  const enabledGoals = goals.filter(g => g.enabled);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-500" />
          Today's Checklist
        </h2>
        <button
          onClick={onAddGoal}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Goal
        </button>
      </div>

      {enabledGoals.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center">
          <Target className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400 mb-4">No goals yet. Create your first goal to start tracking!</p>
          <button
            onClick={onAddGoal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Create Goal
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {enabledGoals.map((goal, i) => (
            <motion.div
              key={goal._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`glass-card rounded-xl p-4 border transition-all ${
                goal.completedToday
                  ? 'border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-900/10'
                  : 'border-gray-200/50 dark:border-gray-700/50 hover:border-indigo-200 dark:hover:border-indigo-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => !goal.completedToday && onComplete(goal._id)}
                  disabled={goal.completedToday}
                  className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                    goal.completedToday
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'border-gray-300 dark:border-gray-600 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
                  }`}
                >
                  {goal.completedToday && <Check className="w-4 h-4" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${
                    goal.completedToday
                      ? 'text-emerald-700 dark:text-emerald-300 line-through'
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    {platformIcons[goal.platform] || '🎯'} {goal.title}
                  </p>
                  {goal.target && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{goal.target}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {goal.currentStreak > 0 && (
                    <span className="text-xs font-medium text-orange-600 dark:text-orange-400 flex items-center gap-1">
                      <Flame className="w-3 h-3" /> {goal.currentStreak}d
                    </span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    goal.completedToday
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {goal.completedToday ? 'Done' : 'Pending'}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── PLATFORM CARDS ─────────────────────────────────────────────
const PlatformCards = ({ integrations, onRefresh, refreshing }) => {
  const platforms = integrations?.platforms || [];
  const allPlatforms = [
    'github', 'leetcode', 'duolingo', 'hackerrank',
    'codechef', 'codeforces', 'gfg', 'kaggle'
  ];
  const connectedPlatformNames = platforms.map(p => p.platform);
  const unconnected = allPlatforms.filter(p => !connectedPlatformNames.includes(p));

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <Link2 className="w-5 h-5 text-indigo-500" />
        Platform Integrations
        <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">
          ({integrations?.connected || 0} connected)
        </span>
      </h2>

      {/* Connected platforms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {platforms.map(platform => (
          <motion.div
            key={platform.platform}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-xl p-5 border border-gray-200/50 dark:border-gray-700/50"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{platform.info?.icon || platformIcons[platform.platform]}</span>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{platform.info?.name || platform.platform}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">@{platform.username}</p>
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                platform.status === 'connected'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
              }`}>
                {platform.connectionType === 'api-verified' ? '✓ Verified' :
                 platform.connectionType === 'public-profile' ? 'Public Profile' : 'Manual'}
              </span>
            </div>

            {/* Stats */}
            {platform.status === 'connected' && (
              <div className="space-y-2 mb-3">
                {platform.currentStreak !== null && platform.info?.streakReliable && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Streak</span>
                    <span className="font-medium text-orange-600 dark:text-orange-400 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5" /> {platform.currentStreak} days
                    </span>
                  </div>
                )}
                {platform.currentStreak !== null && !platform.info?.streakReliable && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/10 rounded-lg px-2.5 py-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    Streak data may not be fully verified
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Today</span>
                  <span className={`font-medium ${platform.activityToday ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
                    {platform.activityToday ? '✓ Active' : '—'}
                  </span>
                </div>
                {platform.details?.totalSolved != null && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Problems</span>
                    <span className="font-medium text-gray-900 dark:text-white">{platform.details.totalSolved} solved</span>
                  </div>
                )}
                {platform.details?.totalContributions != null && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Contributions</span>
                    <span className="font-medium text-gray-900 dark:text-white">{platform.details.totalContributions}</span>
                  </div>
                )}
                {platform.details?.totalXp != null && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Total XP</span>
                    <span className="font-medium text-gray-900 dark:text-white">{platform.details.totalXp.toLocaleString()}</span>
                  </div>
                )}
              </div>
            )}

            {platform.status === 'error' && (
              <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/10 rounded-lg px-2.5 py-1.5 mb-3">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                Unable to verify activity right now. We'll try again later.
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              {platform.profileUrl && (
                <a
                  href={platform.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open Profile
                </a>
              )}
              <button
                onClick={() => onRefresh(platform.platform)}
                disabled={refreshing === platform.platform}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 ml-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing === platform.platform ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Unconnected platforms */}
      {unconnected.length > 0 && (
        <>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-6">Available Platforms</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {unconnected.map(p => (
              <div
                key={p}
                className="glass-card rounded-xl p-4 border border-dashed border-gray-300 dark:border-gray-700 text-center opacity-70 hover:opacity-100 transition-opacity"
              >
                <span className="text-2xl">{platformIcons[p]}</span>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-2 capitalize">{p === 'gfg' ? 'GeeksforGeeks' : p}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Connect via <span className="text-indigo-500">DevPulse</span>
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ─── GOALS LIST ─────────────────────────────────────────────────
const GoalsList = ({ goals, onComplete, onEdit, onDelete, onAddGoal }) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <Target className="w-5 h-5 text-indigo-500" />
        All Goals
        <span className="text-sm font-normal text-gray-500 dark:text-gray-400">({goals.length})</span>
      </h2>
      <button
        onClick={onAddGoal}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg font-medium transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add Goal
      </button>
    </div>

    {goals.length === 0 ? (
      <div className="glass-card rounded-xl p-8 text-center">
        <Target className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
        <p className="text-gray-500 dark:text-gray-400">No goals created yet.</p>
      </div>
    ) : (
      <div className="space-y-3">
        {goals.map((goal, i) => (
          <motion.div
            key={goal._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="glass-card rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => !goal.completedToday && onComplete(goal._id)}
                  disabled={goal.completedToday}
                  className={`flex-shrink-0 w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all ${
                    goal.completedToday
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'border-gray-300 dark:border-gray-600 hover:border-indigo-500'
                  }`}
                >
                  {goal.completedToday && <Check className="w-4 h-4" />}
                </button>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {platformIcons[goal.platform] || '🎯'} {goal.title}
                  </p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      {categoryIcons[goal.category]}
                      {goal.category}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {goal.frequency}
                    </span>
                    {goal.target && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">{goal.target}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                {goal.currentStreak > 0 && (
                  <div className="text-center">
                    <p className="text-sm font-bold text-orange-500">{goal.currentStreak}</p>
                    <p className="text-[10px] text-gray-500">streak</p>
                  </div>
                )}
                <button onClick={() => onEdit(goal)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  <Edit3 className="w-4 h-4 text-gray-400" />
                </button>
                <button onClick={() => onDelete(goal._id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    )}
  </div>
);

// ─── GOAL MODAL ─────────────────────────────────────────────────
const GoalModal = ({ goal, onClose, onSaved }) => {
  const [form, setForm] = useState({
    title: goal?.title || '',
    category: goal?.category || 'custom',
    platform: goal?.platform || 'custom',
    frequency: goal?.frequency || 'daily',
    target: goal?.target || '',
    reminderTime: goal?.reminderTime || '20:00',
    emailEnabled: goal?.emailEnabled ?? true,
    inAppEnabled: goal?.inAppEnabled ?? true,
    enabled: goal?.enabled ?? true,
    customDays: goal?.customDays || [1, 2, 3, 4, 5]
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Goal title is required');
      return;
    }
    setSaving(true);
    try {
      if (goal?._id) {
        await api.put(`/activity/goals/${goal._id}`, form);
        toast.success('Goal updated');
      } else {
        await api.post('/activity/goals', form);
        toast.success('Goal created! 🎯');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save goal');
    } finally {
      setSaving(false);
    }
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const suggestedGoals = [
    { title: 'Complete one LeetCode problem', category: 'coding', platform: 'leetcode', target: 'Easy or Medium' },
    { title: 'Complete Duolingo daily lesson', category: 'learning', platform: 'duolingo', target: '15 minutes' },
    { title: 'Make a GitHub contribution', category: 'coding', platform: 'github', target: 'Commit or PR' },
    { title: 'Study DBMS', category: 'learning', platform: 'custom', target: '30 minutes' },
    { title: 'Practice DSA', category: 'coding', platform: 'custom', target: '1 hour' },
    { title: 'Work on project', category: 'project', platform: 'custom', target: '45 minutes' },
    { title: 'Apply for internships', category: 'career', platform: 'custom', target: '2 applications' },
    { title: 'Read technical article', category: 'learning', platform: 'custom', target: '1 article' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-gray-900 px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {goal?._id ? 'Edit Goal' : 'Create Goal'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Quick suggestions (only for new goals) */}
          {!goal?._id && (
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Quick Add</label>
              <div className="flex flex-wrap gap-1.5">
                {suggestedGoals.map(sg => (
                  <button
                    key={sg.title}
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, ...sg }))}
                    className="text-xs px-2.5 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors"
                  >
                    {platformIcons[sg.platform]} {sg.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Goal Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Complete one LeetCode problem"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              maxLength={100}
              required
            />
          </div>

          {/* Category & Platform */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
              <select
                value={form.category}
                onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              >
                <option value="coding">💻 Coding</option>
                <option value="learning">📚 Learning</option>
                <option value="career">📈 Career</option>
                <option value="project">🌐 Project</option>
                <option value="custom">🎯 Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Platform</label>
              <select
                value={form.platform}
                onChange={e => setForm(prev => ({ ...prev, platform: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              >
                <option value="custom">🎯 Custom</option>
                <option value="leetcode">🔥 LeetCode</option>
                <option value="github">💻 GitHub</option>
                <option value="duolingo">🌍 Duolingo</option>
                <option value="hackerrank">🏅 HackerRank</option>
                <option value="codechef">👨‍🍳 CodeChef</option>
                <option value="codeforces">⚡ Codeforces</option>
                <option value="gfg">📗 GeeksforGeeks</option>
                <option value="kaggle">📊 Kaggle</option>
              </select>
            </div>
          </div>

          {/* Target & Frequency */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target (optional)</label>
              <input
                type="text"
                value={form.target}
                onChange={e => setForm(prev => ({ ...prev, target: e.target.value }))}
                placeholder="e.g., 30 minutes"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                maxLength={100}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Frequency</label>
              <select
                value={form.frequency}
                onChange={e => setForm(prev => ({ ...prev, frequency: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              >
                <option value="daily">Daily</option>
                <option value="weekdays">Weekdays</option>
                <option value="custom">Custom Days</option>
              </select>
            </div>
          </div>

          {/* Custom Days */}
          {form.frequency === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Days</label>
              <div className="flex gap-1.5">
                {dayNames.map((day, i) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => {
                      setForm(prev => ({
                        ...prev,
                        customDays: prev.customDays.includes(i)
                          ? prev.customDays.filter(d => d !== i)
                          : [...prev.customDays, i].sort()
                      }));
                    }}
                    className={`w-10 h-10 rounded-lg text-xs font-medium transition-all ${
                      form.customDays.includes(i)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Reminder Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reminder Time</label>
            <input
              type="time"
              value={form.reminderTime}
              onChange={e => setForm(prev => ({ ...prev, reminderTime: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            />
          </div>

          {/* Notification toggles */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.emailEnabled}
                onChange={e => setForm(prev => ({ ...prev, emailEnabled: e.target.checked }))}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Email</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.inAppEnabled}
                onChange={e => setForm(prev => ({ ...prev, inAppEnabled: e.target.checked }))}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">In-app</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={e => setForm(prev => ({ ...prev, enabled: e.target.checked }))}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
            </label>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm rounded-lg font-medium transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {goal?._id ? 'Save Changes' : 'Create Goal'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// ─── PREFERENCES MODAL ──────────────────────────────────────────
const PreferencesModal = ({ preferences, onClose, onSaved }) => {
  const [form, setForm] = useState({
    emailEnabled: preferences?.emailEnabled ?? true,
    inAppEnabled: preferences?.inAppEnabled ?? true,
    dailyReminder: preferences?.dailyReminder ?? true,
    streakAlert: preferences?.streakAlert ?? true,
    milestoneAlert: preferences?.milestoneAlert ?? true,
    weeklySummary: preferences?.weeklySummary ?? true,
    platformUpdates: preferences?.platformUpdates ?? false,
    reminderTime: preferences?.reminderTime || '20:00',
    quietHoursEnabled: preferences?.quietHoursEnabled ?? true,
    quietHoursStart: preferences?.quietHoursStart || '22:00',
    quietHoursEnd: preferences?.quietHoursEnd || '07:00',
    timezone: preferences?.timezone || 'Asia/Kolkata',
    reminderDays: preferences?.reminderDays || [1, 2, 3, 4, 5]
  });
  const [saving, setSaving] = useState(false);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/activity/preferences', form);
      toast.success('Preferences saved');
      onSaved(res.data);
    } catch (err) {
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-gray-900 px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-500" />
              Notification Preferences
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Email Notifications */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              📧 Email Notifications
            </h3>
            <div className="space-y-2">
              {[
                { key: 'dailyReminder', label: 'Daily reminders' },
                { key: 'streakAlert', label: 'Streak alerts' },
                { key: 'milestoneAlert', label: 'Milestones' },
                { key: 'weeklySummary', label: 'Weekly summary' },
                { key: 'platformUpdates', label: 'Platform updates' }
              ].map(item => (
                <label key={item.key} className="flex items-center justify-between py-1 cursor-pointer">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{item.label}</span>
                  <input
                    type="checkbox"
                    checked={form[item.key]}
                    onChange={e => setForm(prev => ({ ...prev, [item.key]: e.target.checked }))}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Reminder Time */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">⏰ Reminder Time</label>
            <input
              type="time"
              value={form.reminderTime}
              onChange={e => setForm(prev => ({ ...prev, reminderTime: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            />
          </div>

          {/* Quiet Hours */}
          <div>
            <label className="flex items-center justify-between mb-2 cursor-pointer">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">🌙 Quiet Hours</span>
              <input
                type="checkbox"
                checked={form.quietHoursEnabled}
                onChange={e => setForm(prev => ({ ...prev, quietHoursEnabled: e.target.checked }))}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
            </label>
            {form.quietHoursEnabled && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">From</label>
                  <input
                    type="time"
                    value={form.quietHoursStart}
                    onChange={e => setForm(prev => ({ ...prev, quietHoursStart: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">To</label>
                  <input
                    type="time"
                    value={form.quietHoursEnd}
                    onChange={e => setForm(prev => ({ ...prev, quietHoursEnd: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Reminder Days */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">📅 Reminder Days</label>
            <div className="flex gap-1.5">
              {dayNames.map((day, i) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => {
                    setForm(prev => ({
                      ...prev,
                      reminderDays: prev.reminderDays.includes(i)
                        ? prev.reminderDays.filter(d => d !== i)
                        : [...prev.reminderDays, i].sort()
                    }));
                  }}
                  className={`w-10 h-10 rounded-lg text-xs font-medium transition-all ${
                    form.reminderDays.includes(i)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Timezone */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1">🌐 Timezone</label>
            <select
              value={form.timezone}
              onChange={e => setForm(prev => ({ ...prev, timezone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            >
              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
              <option value="Europe/Berlin">Europe/Berlin (CET)</option>
              <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
              <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
              <option value="Australia/Sydney">Australia/Sydney (AEDT)</option>
              <option value="UTC">UTC</option>
            </select>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm rounded-lg font-medium transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Save Preferences
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ActivityHub;
