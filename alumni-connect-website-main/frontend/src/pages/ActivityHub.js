import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  ChevronLeft,
  ChevronDown,
  ShieldCheck,
  AlertTriangle,
  Trophy,
  Edit3,
  Trash2,
  Calendar,
  Check,
  Loader2,
  Sparkles,
  ArrowRight,
  Code,
  BookOpen,
  Globe,
  TrendingUp,
  X
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
  const [tzMismatchDismissed, setTzMismatchDismissed] = useState(false);

  // Tab Filtering states
  const [todayFilter, setTodayFilter] = useState('all'); // 'all', 'pending', 'completed'

  // Horizontal Roller Navigation State & Auto-centering
  const tabsContainerRef = useRef(null);
  const activeTabRef = useRef(null);

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  // Smoothly center the active tab in the horizontal roller when it changes
  useEffect(() => {
    if (activeTabRef.current) {
      activeTabRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [activeTab]);

  const scrollTabs = (direction) => {
    if (tabsContainerRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      tabsContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
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
    let isSubscribed = true;
    const init = async () => {
      setLoading(true);
      await reloadAll();
      setLoading(false);

      // Section 45 & 76: Freshness check on opening Activity Hub
      // If last remote sync > 5 minutes ago, auto-sync in background
      try {
        const res = await api.get('/activity/dashboard');
        const lastSync = res.data?.syncFreshness?.lastRemoteSyncAt;
        const lastTime = lastSync ? new Date(lastSync).getTime() : 0;
        const minutesAgo = (Date.now() - lastTime) / (60 * 1000);
        if ((!lastSync || minutesAgo > 5) && isSubscribed) {
          setIsSyncingAll(true);
          const syncRes = await api.post('/activity/sync');
          if (isSubscribed) {
            if (syncRes.data?.summary) setDashboard(syncRes.data.summary);
            await Promise.all([fetchGoals(), fetchTimeline()]);
          }
        }
      } catch (err) {
        // Non-blocking auto-sync
      } finally {
        if (isSubscribed) setIsSyncingAll(false);
      }
    };
    init();
    return () => { isSubscribed = false; };
  }, [reloadAll, fetchGoals, fetchTimeline]);

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

  const allTabs = [
    { id: 'overview', label: 'Overview', icon: Zap, desc: 'Personal momentum briefing and daily rhythm' },
    { id: 'today', label: "Today's Plan", icon: CheckCircle2, desc: 'Daily focus, priorities and habit completion' },
    { id: 'streaks', label: 'Streaks', icon: Flame, desc: 'Streak intelligence, milestones and protection' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, desc: 'Consistency index, habit trends and yearly calendar' },
    { id: 'goals', label: 'Goals', icon: Target, desc: 'Create and manage habit goals and targets' },
    { id: 'platforms', label: 'Platforms', icon: Link2, desc: 'Connected accounts and synchronization' },
    { id: 'timeline', label: 'Timeline', icon: Clock, desc: 'Full audit trail of verified activity events' },
    { id: 'settings', label: 'Settings', icon: Settings, desc: 'Timezone, reminders, quiet hours and data controls' },
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

  // Top Priority Goal
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

  // Current Local Date Formats
  const { currentDateFormatted, currentDateShort } = useMemo(() => {
    const tz = preferences?.timezone || 'Asia/Kolkata';
    try {
      const full = new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        timeZone: tz
      }).format(new Date());

      const short = new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        timeZone: tz
      }).format(new Date());

      return { currentDateFormatted: full, currentDateShort: short };
    } catch {
      return {
        currentDateFormatted: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
        currentDateShort: new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      };
    }
  }, [preferences?.timezone]);

  // Timezone Mismatch Detection (Prompt #27)
  const detectedTz = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return null;
    }
  }, []);

  const showTzMismatchBanner = useMemo(() => {
    if (tzMismatchDismissed) return false;
    if (!preferences?.timezone || !detectedTz) return false;
    return preferences.timezone !== detectedTz;
  }, [preferences?.timezone, detectedTz, tzMismatchDismissed]);

  // ─── DATA-DRIVEN PERSONALIZATION ENGINE ──────────────────────

  const personalization = useMemo(() => {
    const firstName = user?.name ? user.name.trim().split(' ')[0] : 'Friend';

    // Local hour calculation for greeting based on user's timezone
    let hour = new Date().getHours();
    try {
      const tz = preferences?.timezone || 'Asia/Kolkata';
      const formatter = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        hour12: false,
        timeZone: tz
      });
      hour = parseInt(formatter.format(new Date()), 10);
    } catch {
      hour = new Date().getHours();
    }

    let greetingTime = 'Good day';
    let greetingIcon = '👋';
    if (hour >= 5 && hour < 12) {
      greetingTime = 'Good morning';
      greetingIcon = '☀️';
    } else if (hour >= 12 && hour < 17) {
      greetingTime = 'Good afternoon';
      greetingIcon = '👋';
    } else if (hour >= 17 && hour < 22) {
      greetingTime = 'Good evening';
      greetingIcon = '🌙';
    } else {
      greetingTime = 'Late night focus';
      greetingIcon = '✨';
    }
    const greeting = `${greetingTime}, ${firstName} ${greetingIcon}`;

    const currentStreak = dashboard?.overallStreak?.current ?? 0;
    const longestStreak = dashboard?.overallStreak?.longest ?? 0;
    const isProtectedToday = dashboard?.overallStreak?.activeToday ?? false;
    const isAtRisk = dashboard?.overallStreak?.atRisk ?? false;
    const nextMilestone = dashboard?.overallStreak?.milestones?.next || 7;

    const pendingGoals = todayGoalsList.filter(g => !g.completedToday);
    const completedGoals = todayGoalsList.filter(g => g.completedToday);
    const allCompleted = todayGoalsList.length > 0 && pendingGoals.length === 0;

    // Contextual Today message (Prompt #11, #13)
    let todaySentence = '';
    if (allCompleted) {
      todaySentence = `You're done for today, ${firstName}. All ${completedGoals.length} goals completed and your streak is protected.`;
    } else if (isAtRisk || pendingGoals.some(g => g.atRisk)) {
      todaySentence = `Your ${rankedCategories[0]?.name?.toLowerCase() || 'activity'} streak needs attention before your activity day ends.`;
    } else if (currentStreak > 0) {
      if (isProtectedToday) {
        todaySentence = `You're on a ${currentStreak}-day run, ${firstName}. Momentum is locked in for today.`;
      } else {
        todaySentence = `You're on a ${currentStreak}-day run, ${firstName}. One more completed activity keeps it alive.`;
      }
    } else if (todayGoalsList.length === 0) {
      todaySentence = 'Set your first goal or connect a platform to start tracking momentum.';
    } else {
      todaySentence = 'Your activity journey starts today. Complete one action to build your streak.';
    }

    // Dynamic Momentum Insight (Prompt #44)
    const platforms = dashboard?.integrations?.platforms || [];
    const topPlatform = [...platforms].sort((a, b) => (b.currentStreak || 0) - (a.currentStreak || 0))[0];
    const topCategory = rankedCategories.find(c => c.current > 0) || rankedCategories[0];

    let insightText = '';
    if (dashboard?.insights?.[0]?.message) {
      insightText = dashboard.insights[0].message;
    } else if (topPlatform && (topPlatform.currentStreak || 0) > 0) {
      insightText = `Your ${topPlatform.platform} streak is currently your strongest platform at ${topPlatform.currentStreak} days.`;
    } else if (topCategory && topCategory.current > 0) {
      insightText = `${topCategory.name} is currently your strongest activity area. Keep it going to reach your next milestone.`;
    } else if (dashboard?.weekly?.activeDaysCount > 0) {
      insightText = `You've been active ${dashboard.weekly.activeDaysCount} of 7 days this week.`;
    } else {
      insightText = 'Connecting developer accounts automatically verifies your daily progress without manual logging.';
    }

    // Next Best Action (Prompt #45)
    let nextAction = null;
    if (todayGoalsList.length === 0) {
      nextAction = {
        label: 'Create your first goal →',
        handler: () => {
          setEditingGoal(null);
          setShowGoalModal(true);
        }
      };
    } else if (pendingGoals.length > 0) {
      const priority = pendingGoals[0];
      nextAction = {
        label: `Complete ${priority.title} →`,
        handler: () => handleTabChange('today')
      };
    } else {
      nextAction = {
        label: `All goals done ✓ Next milestone: ${nextMilestone}-day streak`,
        handler: () => handleTabChange('streaks')
      };
    }

    // Weekly active summary
    const weeklyDays = dashboard?.weekly?.days || [];
    const weeklyActiveDays = dashboard?.weekly?.activeDaysCount ?? weeklyDays.filter(d => d.active).length;

    return {
      firstName,
      greeting,
      todaySentence,
      currentStreak,
      longestStreak,
      isProtectedToday,
      isAtRisk,
      nextMilestone,
      allCompleted,
      insightText,
      nextAction,
      weeklyDays,
      weeklyActiveDays
    };
  }, [user?.name, preferences?.timezone, dashboard, todayGoalsList, rankedCategories]);

  // Step 60: Dynamic synchronization freshness indicator
  const syncFreshnessInfo = useMemo(() => {
    if (isSyncingAll) {
      return {
        text: 'Syncing...',
        status: 'syncing',
        badgeClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30'
      };
    }
    const freshness = dashboard?.syncFreshness;
    if (freshness?.syncStatus === 'failed' || freshness?.syncStatus === 'temporarily-unavailable') {
      return {
        text: 'Verification delayed',
        status: 'delayed',
        badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
      };
    }
    const timestamp = freshness?.lastSuccessfulRemoteSyncAt || freshness?.lastRemoteSyncAt;
    if (!timestamp) {
      return {
        text: 'Pending sync',
        status: 'pending',
        badgeClass: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700'
      };
    }
    const msAgo = Date.now() - new Date(timestamp).getTime();
    const minsAgo = Math.max(0, Math.floor(msAgo / 60000));
    if (minsAgo < 1) {
      return {
        text: 'Synced just now',
        status: 'fresh',
        badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
      };
    }
    if (minsAgo === 1) {
      return {
        text: 'Synced 1 minute ago',
        status: 'fresh',
        badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
      };
    }
    if (minsAgo < 60) {
      return {
        text: `Synced ${minsAgo} minutes ago`,
        status: minsAgo <= 15 ? 'fresh' : 'normal',
        badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
      };
    }
    const hoursAgo = Math.floor(minsAgo / 60);
    return {
      text: `Last verified ${hoursAgo}h ago`,
      status: 'stale',
      badgeClass: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700'
    };
  }, [isSyncingAll, dashboard?.syncFreshness]);

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
    <div className="max-w-6xl mx-auto w-full min-w-0 px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5 sm:space-y-6 pb-32 lg:pb-16 selection:bg-indigo-500/20">
      {/* ── MOBILE COMPACT HEADER (sm:hidden) ── */}
      <div className="sm:hidden flex items-center justify-between gap-2 pb-3 border-b border-gray-200/50 dark:border-gray-800 min-w-0">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-gray-900 dark:text-white font-black text-lg min-w-0">
            <Zap className="w-5 h-5 text-amber-500 fill-amber-500 shrink-0" />
            <span className="truncate">Activity Hub</span>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5 flex items-center gap-1.5">
            <span>Today • {currentDateShort}</span>
            <span>•</span>
            <span className={syncFreshnessInfo.status === 'delayed' ? 'text-amber-500 font-bold' : ''}>
              {syncFreshnessInfo.text}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleSyncAll}
            disabled={isSyncingAll}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 text-indigo-600 dark:text-indigo-400 text-xs font-bold active:scale-95 transition-all shadow-sm shrink-0"
            title="Scan connected accounts"
          >
            <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isSyncingAll ? 'animate-spin text-indigo-500' : ''}`} />
            <span>{isSyncingAll ? '...' : 'Sync'}</span>
          </button>

          <button
            onClick={() => {
              setEditingGoal(null);
              setShowGoalModal(true);
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold active:scale-95 transition-all shadow-md shadow-indigo-600/20 shrink-0"
            title="Create Goal"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span>Goal</span>
          </button>
        </div>
      </div>

      {/* ── DESKTOP RICH HEADER (hidden sm:flex) ── */}
      <div className="hidden sm:flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200/50 dark:border-gray-800 min-w-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white flex items-center gap-2.5 min-w-0">
            <Zap className="w-7 h-7 text-amber-500 fill-amber-500 shrink-0" />
            <span className="truncate">Activity Intelligence</span>
          </h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Automated tracking, streak intelligence & career momentum
            </span>
            <span className="text-gray-300 dark:text-gray-700 hidden sm:inline">•</span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${syncFreshnessInfo.badgeClass}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                syncFreshnessInfo.status === 'delayed'
                  ? 'bg-amber-500'
                  : syncFreshnessInfo.status === 'syncing'
                  ? 'bg-indigo-500 animate-ping'
                  : 'bg-emerald-500'
              }`} />
              <span>{syncFreshnessInfo.text}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={handleSyncAll}
            disabled={isSyncingAll}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-all active:scale-95 shadow-sm whitespace-nowrap shrink-0"
            title="Scan connected accounts for new activity"
          >
            <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isSyncingAll ? 'animate-spin text-indigo-500' : ''}`} />
            <span>{isSyncingAll ? 'Syncing...' : 'Sync Platforms'}</span>
          </button>

          <button
            onClick={() => {
              setEditingGoal(null);
              setShowGoalModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all active:scale-95 whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>New Goal</span>
          </button>
        </div>
      </div>

      {/* ── TIMEZONE MISMATCH BANNER (Prompt #27) ── */}
      {showTzMismatchBanner && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 rounded-xl bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-start sm:items-center gap-2.5 min-w-0">
            <Globe className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5 sm:mt-0" />
            <div className="min-w-0">
              <span className="font-bold text-gray-900 dark:text-white">Device timezone detected: </span>
              <span className="text-gray-600 dark:text-gray-300">
                Your device appears to be in <strong>{detectedTz}</strong>, while Activity Hub uses <strong>{preferences?.timezone}</strong>.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
            <button
              onClick={() => setTzMismatchDismissed(true)}
              className="px-2.5 py-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-semibold text-xs"
            >
              Keep Current
            </button>
            <button
              onClick={async () => {
                try {
                  await api.put('/activity/preferences', { timezone: detectedTz });
                  toast.success(`Timezone updated to ${detectedTz}`);
                  fetchPreferences();
                  fetchDashboard();
                  setTzMismatchDismissed(true);
                } catch {
                  toast.error('Failed to update timezone');
                }
              }}
              className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm"
            >
              Update to {detectedTz}
            </button>
          </div>
        </motion.div>
      )}

      {/* Sync Feedback Banner (Contextual) */}
      {syncFeedback && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>
              <strong>Sync Complete:</strong> {syncFeedback.detectedCount} new activit{syncFeedback.detectedCount === 1 ? 'y' : 'ies'} detected at {syncFeedback.timestamp}.
            </span>
          </div>
          <button
            onClick={() => setSyncFeedback(null)}
            className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline ml-2 flex-shrink-0"
          >
            Dismiss
          </button>
        </motion.div>
      )}

      {/* ── UNIFIED HORIZONTAL ROLLER NAVIGATION (All 8 Activity Hub Sections) ── */}
      <div className="relative w-full min-w-0 group/roller">
        {/* Left Arrow Button (Desktop / Tablet) */}
        <button
          type="button"
          onClick={() => scrollTabs('left')}
          className="hidden sm:flex absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700 shadow-md items-center justify-center text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 opacity-0 group-hover/roller:opacity-100 focus:opacity-100 transition-opacity"
          aria-label="Scroll navigation left"
        >
          <ChevronLeft className="w-4 h-4 shrink-0" />
        </button>

        {/* Scrollable Horizontal Track */}
        <div
          ref={tabsContainerRef}
          onWheel={(e) => {
            if (e.deltaY !== 0) {
              e.currentTarget.scrollLeft += e.deltaY;
            }
          }}
          className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto touch-pan-x custom-scrollbar py-1 px-1 scroll-smooth select-none min-w-0"
        >
          {allTabs.map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                ref={isActive ? activeTabRef : null}
                onClick={() => handleTabChange(t.id)}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all shrink-0 active:scale-95 border ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/25 ring-2 ring-indigo-500/20'
                    : 'bg-white dark:bg-gray-800/80 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border-gray-200/80 dark:border-gray-700/80 hover:border-indigo-300 dark:hover:border-indigo-700/60 shadow-sm'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-indigo-500 dark:text-indigo-400'}`} />
                <span>{t.label}</span>
                {t.id === 'streaks' && (dashboard?.overallStreak?.current || 0) > 0 && (
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                  }`}>
                    {dashboard.overallStreak.current}d
                  </span>
                )}
                {t.id === 'today' && totalTodayCount > 0 && (
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                  }`}>
                    {completedTodayCount}/{totalTodayCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Arrow Button (Desktop / Tablet) */}
        <button
          type="button"
          onClick={() => scrollTabs('right')}
          className="hidden sm:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700 shadow-md items-center justify-center text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 opacity-0 group-hover/roller:opacity-100 focus:opacity-100 transition-opacity"
          aria-label="Scroll navigation right"
        >
          <ChevronRight className="w-4 h-4 shrink-0" />
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════
          TAB 1: OVERVIEW — PERSONAL ACTIVITY CONTROL CENTER
         ══════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-4 sm:space-y-6">
          {/* ── MOBILE-FIRST OVERVIEW BRIEFING (md:hidden) (Prompt #10, #60) ── */}
          <div className="md:hidden space-y-4">
            {/* 1. Identity & Contextual Greeting */}
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Activity Intelligence</span>
              </div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white">
                {personalization.greeting}
              </h2>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                {personalization.todaySentence}
              </p>
            </div>

            {/* 2. Next Best Action Banner (Prompt #45) */}
            {personalization.nextAction && (
              <button
                onClick={personalization.nextAction.handler}
                className="w-full p-3 rounded-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 border border-indigo-500/30 flex items-center justify-between text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:border-indigo-500/50 active:scale-98 transition-all"
              >
                <span className="truncate">{personalization.nextAction.label}</span>
                <ArrowRight className="w-4 h-4 flex-shrink-0 ml-2" />
              </button>
            )}

            {/* 3. Current Streak Hero Card */}
            <div className="p-4 rounded-2xl glass-card border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <Flame className="w-6 h-6 text-amber-500 fill-amber-500 animate-pulse" />
                  <span className="text-3xl font-black text-gray-900 dark:text-white">
                    {personalization.currentStreak}
                  </span>
                  <span className="text-xs font-black text-gray-500 uppercase tracking-wider">
                    {personalization.currentStreak === 1 ? 'DAY' : 'DAYS'}
                  </span>
                </div>
                <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mt-1">Current streak</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  {personalization.isProtectedToday ? '✓ Protected for today' : 'Keep it alive today.'}
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">All-Time Best</span>
                <p className="text-base font-black text-gray-900 dark:text-white">
                  🏆 {personalization.longestStreak}d
                </p>
              </div>
            </div>

            {/* 4. TODAY'S PROGRESS */}
            <div className="space-y-3 p-4 rounded-2xl glass-card border border-gray-200/50 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Today's Progress
                </h3>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  {completedTodayCount} / {totalTodayCount} completed
                </span>
              </div>

              <div className="w-full bg-gray-100 dark:bg-gray-800 h-2.5 rounded-full overflow-hidden">
                <div
                  style={{ width: `${todayProgressPercent}%` }}
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
                />
              </div>

              {/* Priority Goal Card */}
              {topPriorityGoal ? (
                <div className="p-3 rounded-xl bg-white dark:bg-gray-800/80 border border-gray-200/60 dark:border-gray-700/60 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        onClick={() => !topPriorityGoal.completedToday && handleCompleteGoal(topPriorityGoal._id || topPriorityGoal.id)}
                        disabled={topPriorityGoal.completedToday}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          topPriorityGoal.completedToday
                            ? 'bg-emerald-500 text-white'
                            : 'border-2 border-indigo-400 text-transparent hover:text-indigo-600'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                      <span className={`text-sm font-bold truncate ${topPriorityGoal.completedToday ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                        {topPriorityGoal.title}
                      </span>
                    </div>

                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex-shrink-0">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Verified</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-0.5">
                    <span>{topPriorityGoal.target || '1 activity'} • {topPriorityGoal.estimatedMinutes || 20}m</span>
                    {(topPriorityGoal.currentStreak || 0) > 0 && (
                      <span className="flex items-center gap-1 text-amber-500 font-bold">
                        <Flame className="w-3 h-3 fill-amber-500" />
                        {topPriorityGoal.currentStreak}d streak
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 text-center text-xs text-gray-400">
                  No active goals scheduled for today.
                </div>
              )}

              <button
                onClick={() => handleTabChange('today')}
                className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition-all"
              >
                <span>Continue Today's Plan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 5. THIS WEEK (Rhythm starting on Sunday) */}
            <div className="space-y-2.5 p-4 rounded-2xl glass-card border border-gray-200/50 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  This Week
                </span>
                <span className="text-xs font-bold text-gray-900 dark:text-white">
                  {personalization.weeklyActiveDays} of 7 days active
                </span>
              </div>

              {/* 7 Day dots starting on Sunday */}
              <div className="grid grid-cols-7 gap-1 pt-2 text-center">
                {personalization.weeklyDays.map((d, idx) => (
                  <div key={d.date || idx} className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold text-gray-400">
                      {d.dayName?.slice(0, 3) || ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][idx]}
                    </span>
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        d.active
                          ? 'bg-emerald-500 text-white shadow-sm'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                      }`}
                    >
                      {d.active ? '●' : '○'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 6. YOUR MOMENTUM (Zero-noise formatting! Prompt #30) */}
            <div className="space-y-2.5 p-4 rounded-2xl glass-card border border-gray-200/50 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Your Momentum
                </span>
                <button
                  onClick={() => handleTabChange('streaks')}
                  className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  View All
                </button>
              </div>

              <div className="space-y-2">
                {rankedCategories.map(cat => {
                  const Icon = cat.icon;
                  const hasStreak = cat.current > 0;
                  return (
                    <div
                      key={cat.key}
                      className="p-2.5 rounded-xl bg-gray-50/70 dark:bg-gray-800/40 border border-gray-200/40 dark:border-gray-700/40 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${cat.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">
                          {cat.name}
                        </span>
                      </div>

                      <div>
                        {hasStreak ? (
                          <span className="flex items-center gap-1 text-xs font-black text-amber-500">
                            <Flame className="w-3.5 h-3.5 fill-amber-500" />
                            {cat.current} day{cat.current === 1 ? '' : 's'}
                          </span>
                        ) : (
                          <span className="text-[11px] text-gray-400 font-semibold">
                            Not started
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 7. MOMENTUM INSIGHT (Prompt #44) */}
            <div className="p-4 rounded-2xl glass-card border border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/10 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Momentum Insight</span>
              </div>
              <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                {personalization.insightText}
              </p>
              <button
                onClick={() => handleTabChange('streaks')}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline pt-1 block"
              >
                View Streaks & Milestones →
              </button>
            </div>

            {/* 8. RECENT ACTIVITY (Prompt #22) */}
            <div className="space-y-3 p-4 rounded-2xl glass-card border border-gray-200/50 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Recent Activity
                </span>
                <button
                  onClick={() => handleTabChange('timeline')}
                  className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  View Timeline
                </button>
              </div>

              {(dashboard?.recentActivity || []).length > 0 ? (
                <div className="space-y-2.5">
                  {dashboard.recentActivity.slice(0, 3).map((act, idx) => (
                    <div key={act.id || idx} className="flex items-start gap-2.5 text-xs">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-gray-900 dark:text-white block truncate">
                          {act.title}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {act.verified ? 'Verified Activity' : 'Platform Event'} • {act.date || 'Today'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">No recent activity detected yet.</p>
              )}
            </div>
          </div>

          {/* ── DESKTOP RICH OVERVIEW (hidden md:block) ── */}
          <div className="hidden md:block space-y-6">
            {/* Section: Today Hero & Progress */}
            <div className="glass-card rounded-2xl p-6 border border-gray-200/50 dark:border-gray-800 bg-gradient-to-br from-indigo-900/10 via-purple-900/5 to-transparent">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Personal Activity Pulse</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                    {personalization.greeting}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xl">
                    {personalization.todaySentence}
                  </p>

                  <div className="flex items-center gap-3 pt-2">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-black">
                      <Flame className="w-4 h-4 fill-amber-500" />
                      <span>{personalization.currentStreak} day streak</span>
                    </div>
                    <span className="text-xs text-gray-400">
                      Best: {personalization.longestStreak} days
                    </span>
                  </div>
                </div>

                {/* Today's Progress Box */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-200/60 dark:border-gray-700/60 w-full lg:w-auto lg:min-w-[260px] space-y-3">
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
                    className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
              {/* Left: Ranked Momentum Areas */}
              <div className="glass-card rounded-2xl p-6 border border-gray-200/50 dark:border-gray-800 space-y-4 min-w-0">
                <div className="flex items-center justify-between min-w-0">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-2 min-w-0">
                    <Flame className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="truncate">Current Momentum</span>
                  </h3>
                  <button
                    onClick={() => handleTabChange('streaks')}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 shrink-0"
                  >
                    <span>Streak Center</span>
                    <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                  </button>
                </div>

                <div className="space-y-2.5 min-w-0">
                  {rankedCategories.map(cat => {
                    const Icon = cat.icon;
                    return (
                      <div
                        key={cat.key}
                        className="p-3 rounded-xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-200/40 dark:border-gray-700/40 flex items-center justify-between gap-3 min-w-0"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className={`p-1.5 rounded-lg ${cat.color} shrink-0`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-bold text-gray-900 dark:text-white block truncate">
                              {cat.name}
                            </span>
                            <span className="text-[11px] text-gray-400 block truncate">
                              {cat.activeToday ? 'Active today' : cat.current > 0 ? 'Pending today' : 'Not started'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {cat.current > 0 ? (
                            <span className="flex items-center gap-1 text-xs font-extrabold text-amber-500">
                              <Flame className="w-3.5 h-3.5 fill-amber-500 shrink-0" />
                              <span>{cat.current} days</span>
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400 font-semibold">— Not started</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right: Today's Priority & Behavioral Insights */}
              <div className="space-y-6 min-w-0">
                {/* Today's Priority Card */}
                <div className="glass-card rounded-2xl p-6 border border-gray-200/50 dark:border-gray-800 space-y-4 min-w-0">
                  <div className="flex items-center justify-between min-w-0">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-2 min-w-0">
                      <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span className="truncate">Today's Priority</span>
                    </h3>
                    <button
                      onClick={() => handleTabChange('today')}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 shrink-0"
                    >
                      <span>View Full Plan</span>
                      <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                    </button>
                  </div>

                  {topPriorityGoal ? (
                    <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/50 dark:border-indigo-800/40 flex items-center justify-between gap-3 min-w-0">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <button
                          onClick={() => !topPriorityGoal.completedToday && handleCompleteGoal(topPriorityGoal._id || topPriorityGoal.id)}
                          disabled={topPriorityGoal.completedToday}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                            topPriorityGoal.completedToday
                              ? 'bg-emerald-500 text-white shadow-sm'
                              : 'border-2 border-indigo-400 text-transparent hover:text-indigo-600 hover:border-indigo-600'
                          }`}
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 min-w-0 flex-wrap">
                            <span className={`text-sm font-extrabold truncate ${topPriorityGoal.completedToday ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                              {topPriorityGoal.title}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                              <ShieldCheck className="w-3 h-3" />
                              <span>Verified</span>
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                            {topPriorityGoal.target || '1 activity'} • {topPriorityGoal.platform || topPriorityGoal.category}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleTabChange('today')}
                        className="px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 text-xs font-bold border border-gray-200 dark:border-gray-700 hover:bg-gray-50 shrink-0"
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
                <div className="glass-card rounded-2xl p-5 border border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/10 min-w-0">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span>Momentum Insight</span>
                  </h4>
                  <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                    💡 {personalization.insightText}
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
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB 2: TODAY'S PLAN — WHAT SHOULD I DO TODAY?
         ══════════════════════════════════════════════════════════ */}
      {activeTab === 'today' && (
        <div className="space-y-4 sm:space-y-6 min-w-0">
          <div className="glass-card rounded-2xl p-4 sm:p-6 border border-gray-200/50 dark:border-gray-800 space-y-5 min-w-0">
            {/* Header: Date & Timezone */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  {currentDateFormatted}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mt-0.5 truncate">
                  Today's Action Plan
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                  Operating in timezone: <strong className="text-gray-700 dark:text-gray-300">{preferences?.timezone || 'Asia/Kolkata'}</strong>
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingGoal(null);
                  setShowGoalModal(true);
                }}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all active:scale-95 w-full sm:w-auto shrink-0 whitespace-nowrap"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>Add Goal</span>
              </button>
            </div>

            {/* Progress Rail */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 space-y-2">
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="grid grid-cols-3 sm:flex gap-1.5 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-full sm:w-auto">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'pending', label: 'Incomplete' },
                  { id: 'completed', label: 'Completed' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setTodayFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all text-center ${
                      todayFilter === tab.id
                        ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <span className="text-xs text-gray-400 self-end sm:self-center">
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
                      className={`p-3.5 sm:p-4 rounded-xl border transition-all flex items-center justify-between gap-3 ${
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
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {/* Distinct Goal Status UX (Step 61: Completed, Pending, Verifying, Sync delayed, At risk) */}
                            {isCompleted ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                <ShieldCheck className="w-3 h-3" />
                                <span>{goal.completionType === 'api-verified' ? 'Verified' : 'Completed'}</span>
                              </span>
                            ) : isSyncingAll ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 animate-pulse">
                                <Zap className="w-2.5 h-2.5 text-indigo-500" />
                                <span>Verifying...</span>
                              </span>
                            ) : dashboard?.syncFreshness?.syncStatus === 'failed' || dashboard?.syncFreshness?.syncStatus === 'temporarily-unavailable' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                <Clock className="w-2.5 h-2.5" />
                                <span>Sync delayed</span>
                              </span>
                            ) : isAtRisk ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                                <AlertTriangle className="w-3 h-3" />
                                <span>At risk</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                                <Clock className="w-2.5 h-2.5" />
                                <span>Pending</span>
                              </span>
                            )}

                            {/* Auto Track indicator if automatic/hybrid */}
                            {!isCompleted && goal.trackingMode === 'automatic' && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-400">
                                (Auto)
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 sm:gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1 flex-wrap">
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
        <div className="space-y-4 sm:space-y-6">
          {/* Top: Streak Center Hero */}
          <div className="glass-card rounded-2xl p-4 sm:p-6 border border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-transparent to-purple-500/5 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 sm:gap-6 min-w-0">
              <div className="min-w-0 flex-1">
                <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Streak Center
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mt-1">
                  Your consistency at a glance
                </h2>
                <div className="mt-3 flex items-baseline gap-2">
                  <Flame className="w-8 h-8 text-amber-500 fill-amber-500 animate-pulse shrink-0" />
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

              <div className="grid grid-cols-2 gap-3 w-full sm:w-auto sm:min-w-[240px] shrink-0">
                <div className="p-3.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200/60 dark:border-gray-700/60 text-center sm:text-left min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Best Streak</span>
                  <p className="text-lg font-black text-gray-900 dark:text-white mt-0.5 truncate">
                    {dashboard?.overallStreak?.longest ?? 0} days
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200/60 dark:border-gray-700/60 text-center sm:text-left min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Today's State</span>
                  <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center justify-center sm:justify-start gap-1 truncate">
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
            syncFreshness={dashboard?.syncFreshness}
            isSyncing={isSyncingAll}
          />

          {/* Milestone Timeline */}
          <MilestoneTimeline
            milestoneData={dashboard?.overallStreak?.milestones}
            currentStreak={dashboard?.overallStreak?.current}
          />

          {/* Ranked Category Streaks */}
          <div className="glass-card rounded-2xl p-4 sm:p-6 border border-gray-200/50 dark:border-gray-800 space-y-4 min-w-0">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500 shrink-0" />
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
                  <div key={cat.key} className="py-3 flex items-center justify-between gap-2 sm:gap-4 min-w-0">
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                      <div className={`p-2 rounded-xl ${cat.color} shrink-0`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-bold text-gray-900 dark:text-white block truncate">
                          {cat.name}
                        </span>
                        <span className="text-xs text-gray-400 block truncate">
                          Best: {cat.longest} days
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      <span className={`text-[11px] sm:text-xs font-semibold px-2 py-0.5 rounded-full ${
                        cat.activeToday
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                      }`}>
                        {cat.activeToday ? 'Active' : 'Pending'}
                      </span>

                      <div className="flex items-center gap-1 font-black text-xs sm:text-sm text-gray-900 dark:text-white min-w-[55px] sm:min-w-[70px] justify-end">
                        {cat.current > 0 ? (
                          <>
                            <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 fill-amber-500 shrink-0" />
                            <span>{cat.current}d</span>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400 font-semibold">—</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Connected Platform Momentum */}
          {(dashboard?.integrations?.platforms || []).length > 0 && (
            <div className="glass-card rounded-2xl p-4 sm:p-6 border border-gray-200/50 dark:border-gray-800 space-y-4 min-w-0">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-2">
                <Link2 className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>Connected Platform Momentum</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 min-w-0">
                {(dashboard?.integrations?.platforms || []).map(p => (
                  <div
                    key={p.platform}
                    className="p-3.5 rounded-xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-200/40 dark:border-gray-700/40 flex items-center justify-between gap-2.5 min-w-0"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <PlatformIcon platform={p.platform} className="w-5 h-5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold text-gray-900 dark:text-white block capitalize truncate">
                          {p.platform}
                        </span>
                        <span className="text-[11px] text-gray-400 block truncate">
                          {p.username ? `@${p.username}` : 'Connected'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-black text-amber-500 shrink-0">
                      <Flame className="w-3.5 h-3.5 fill-amber-500 shrink-0" />
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
        <div className="space-y-4 sm:space-y-6">
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

            {/* Range Selector: 7D, 30D, 90D, 6M, 1Y */}
            <div className="grid grid-cols-5 sm:flex gap-1 sm:gap-1.5 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-full sm:w-auto">
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
                  className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all text-center ${
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

          {/* Primary Charts & Consistency Index (Balanced 2-Column Grid) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
            <div className="min-w-0">
              <WeeklyActivityChart weeklyData={analytics?.weekly || dashboard?.weekly} />
            </div>
            <div className="min-w-0">
              <ConsistencyScoreCard consistencyData={analytics?.consistency || dashboard?.consistency} />
            </div>
          </div>

          {/* Dedicated Full-Width Personal Records Row */}
          <div className="w-full min-w-0">
            <PersonalRecords records={dashboard?.personalRecords} />
          </div>

          {/* Consistency Index Breakdown Callout Banner */}
          <div className="glass-card rounded-2xl p-5 border border-indigo-500/20 bg-indigo-500/5 dark:bg-indigo-500/10 space-y-2 min-w-0">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>Consistency Index Breakdown</span>
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              Your consistency index factors <strong>Active Days (50%)</strong>, <strong>Goal Completion (30%)</strong>, and <strong>Streak Length (20%)</strong> over the active evaluation window.
            </p>
          </div>

          {/* Full Activity Heatmap with Sunday-first day labels */}
          <div className="w-full min-w-0">
            <ActivityHeatmap heatmapData={analytics?.heatmap} />
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB 5: GOALS — HABIT GOAL MANAGEMENT
         ══════════════════════════════════════════════════════════ */}
      {activeTab === 'goals' && (
        <div className="space-y-4 sm:space-y-6 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0">
            <div className="min-w-0 flex-1">
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white truncate">
                Goal Management
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                Build habits that compound through automated platform tracking and daily focus.
              </p>
            </div>

            <button
              onClick={() => {
                setEditingGoal(null);
                setShowGoalModal(true);
              }}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all active:scale-95 w-full sm:w-auto shrink-0 whitespace-nowrap"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>New Goal</span>
            </button>
          </div>

          {/* Summary Bar */}
          <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between flex-wrap gap-2 text-xs min-w-0">
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap text-gray-600 dark:text-gray-300 min-w-0">
              <span><strong>{goals.length}</strong> active goals</span>
              <span>•</span>
              <span className="text-emerald-600 dark:text-emerald-400"><strong>{completedTodayCount}</strong> completed today</span>
              <span>•</span>
              <span className="text-amber-600 dark:text-amber-400"><strong>{Math.max(goals.length - completedTodayCount, 0)}</strong> pending</span>
            </div>
          </div>

          {/* Goal Cards Grid */}
          {goals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0">
              {goals.map(goal => {
                const CategoryIcon = categoryIcons[goal.category] || Target;
                const isCompleted = goal.completedToday;

                return (
                  <div
                    key={goal._id}
                    className="glass-card rounded-2xl p-4 sm:p-5 border border-gray-200/50 dark:border-gray-800 flex flex-col justify-between gap-4 min-w-0"
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
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm w-full sm:w-auto"
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
        <div className="space-y-4 sm:space-y-6 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0">
            <div className="min-w-0 flex-1">
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white truncate">
                Connected Platforms
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                Activity is automatically verified from your connected developer accounts.
              </p>
            </div>

            <button
              onClick={handleSyncAll}
              disabled={isSyncingAll}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all active:scale-95 w-full sm:w-auto shrink-0 whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isSyncingAll ? 'animate-spin' : ''}`} />
              <span>{isSyncingAll ? 'Syncing...' : 'Sync All Now'}</span>
            </button>
          </div>

          {/* Platform Rows Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-w-0">
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
        <div className="glass-card rounded-2xl p-4 sm:p-6 border border-gray-200/50 dark:border-gray-800 space-y-6 min-w-0">
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white truncate">
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
        <div className="min-w-0">
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
        </div>
      )}

      {/* ── GOAL BUILDER MODAL (Mobile Bottom Sheet) ── */}
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
