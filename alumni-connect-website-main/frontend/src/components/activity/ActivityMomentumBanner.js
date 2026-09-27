import React from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Zap, 
  Flame, 
  Target, 
  BarChart3, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

const ActivityMomentumBanner = ({ activity, userName = 'there' }) => {
  const navigate = useNavigate();

  // If activity is null or not configured yet
  const hasActivityConfigured = activity && (
    (activity.todaysPlan?.total > 0) || 
    (activity.overallStreak?.totalActiveDays > 0) || 
    (activity.overallStreak?.current > 0) ||
    (activity.weekly?.totalActivities > 0)
  );

  const overallStreak = activity?.overallStreak?.current ?? activity?.currentStreak ?? 0;
  const longestStreak = activity?.overallStreak?.longest ?? activity?.longestStreak ?? 0;
  const isAtRisk = activity?.overallStreak?.atRisk ?? false;
  const activeToday = activity?.overallStreak?.activeToday ?? false;

  const totalGoals = activity?.today?.totalGoals ?? activity?.todaysPlan?.total ?? 0;
  const completedGoals = activity?.today?.completedGoals ?? activity?.todaysPlan?.completed ?? 0;

  const weeklyDays = Array.isArray(activity?.weekly?.days) ? activity.weekly.days : [];
  const weeklyActiveDays = activity?.weekly?.activeDaysCount ?? weeklyDays.filter(d => d.active).length;

  // Find the top unfinished goal as today's priority focus
  const goals = Array.isArray(activity?.todaysPlan?.goals) ? activity.todaysPlan.goals : [];
  const focusGoal = goals.find(g => !g.completedToday) || null;
  const allGoalsDone = totalGoals > 0 && completedGoals >= totalGoals;

  // New user / empty state experience
  if (!hasActivityConfigured && (!goals || goals.length === 0)) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden border border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900/60 shadow-xl"
      >
        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-xs font-bold uppercase tracking-wider text-indigo-400">
              <Zap className="w-3.5 h-3.5" />
              <span>Personal Momentum Command Center</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
              Build Your Daily Momentum
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              Track coding, learning, projects, and career progress with automated platform verification and streak tracking.
            </p>
          </div>
          <Link
            to="/activity"
            className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 transition-all hover:scale-[1.02] active:scale-95 hover:no-underline"
          >
            <span>Set Up Activity Tracking</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card rounded-3xl p-6 sm:p-7 relative overflow-hidden border border-indigo-500/20 dark:border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 via-slate-900/80 to-purple-950/30 shadow-xl"
    >
      {/* Background Ambience Glow */}
      <div className="absolute top-0 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-60 h-60 bg-purple-500/10 rounded-full blur-2xl translate-y-1/2 pointer-events-none" />

      <div className="relative z-10 space-y-6">
        {/* Header: Title + Open Activity Hub CTA */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-white/5 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-gray-900 dark:text-white uppercase">
                My Momentum
              </h2>
            </div>
            {isAtRisk && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30 animate-pulse">
                <AlertTriangle className="w-3 h-3" />
                Streak at risk
              </span>
            )}
          </div>

          <Link
            to="/activity"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-indigo-400 hover:text-indigo-300 transition-colors group hover:no-underline"
          >
            <span>Open Activity Hub</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* 3 Core Metric Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* 1. Overall Streak */}
          <div className="p-4 rounded-2xl bg-white/5 dark:bg-white/[0.03] border border-white/10 hover:border-amber-500/30 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Current Streak
              </span>
              <Flame className={`w-4 h-4 ${overallStreak > 0 ? 'text-amber-500 fill-amber-500 animate-pulse' : 'text-gray-400'}`} />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
                {overallStreak}
              </span>
              <span className="text-xs font-bold text-amber-500">
                Day{overallStreak === 1 ? '' : 's'}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
              {overallStreak > 0 
                ? activeToday 
                  ? '✓ Protected for today' 
                  : 'Pending activity today' 
                : longestStreak > 0 
                  ? `Best record: ${longestStreak} days`
                  : 'Start your streak today'}
            </p>
          </div>

          {/* 2. Today's Goals */}
          <div className="p-4 rounded-2xl bg-white/5 dark:bg-white/[0.03] border border-white/10 hover:border-indigo-500/30 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Today's Goals
              </span>
              <Target className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
                {completedGoals} / {totalGoals}
              </span>
              <span className="text-xs font-bold text-indigo-400">
                Completed
              </span>
            </div>
            <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
              {totalGoals === 0 
                ? 'No goals scheduled today'
                : allGoalsDone 
                  ? '🎉 All daily goals completed!' 
                  : `${totalGoals - completedGoals} remaining for today`}
            </p>
          </div>

          {/* 3. Weekly Consistency */}
          <div className="p-4 rounded-2xl bg-white/5 dark:bg-white/[0.03] border border-white/10 hover:border-emerald-500/30 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Active Days
              </span>
              <BarChart3 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
                {weeklyActiveDays} / 7
              </span>
              <span className="text-xs font-bold text-emerald-400">
                This Week
              </span>
            </div>
            <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
              {weeklyActiveDays >= 5 
                ? '🔥 Excellent momentum' 
                : weeklyActiveDays >= 3 
                  ? 'Consistent progress' 
                  : 'Building daily consistency'}
            </p>
          </div>
        </div>

        {/* Weekly Mini Activity Dots (Sun -> Sat) */}
        {weeklyDays.length > 0 && (
          <div className="p-4 rounded-2xl bg-white/[0.03] dark:bg-black/20 border border-white/5">
            <div className="flex items-center justify-between mb-3 text-xs text-gray-500 dark:text-gray-400">
              <span className="font-semibold uppercase tracking-wider text-[11px]">7-Day Activity Rhythm</span>
              <span className="text-[11px]">{weeklyActiveDays} of 7 days logged</span>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {weeklyDays.map((day, idx) => {
                const todayStr = activity?.today?.date || new Date().toISOString().slice(0, 10);
                const isToday = day.date === todayStr;
                return (
                  <div key={day.date || idx} className="flex flex-col items-center gap-1.5">
                    <span className={`text-[11px] font-bold ${isToday ? 'text-indigo-400 underline decoration-2' : 'text-gray-500 dark:text-gray-400'}`}>
                      {day.dayName}
                    </span>
                    <div 
                      title={`${day.dayName} (${day.date}): ${day.active ? `${day.activityCount || 1} activities` : 'No activity'}`}
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        day.active
                          ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                          : 'bg-gray-200 dark:bg-gray-800/80 border border-gray-300 dark:border-gray-700/60'
                      }`}
                    >
                      {day.active ? (
                        <span className="w-2 h-2 rounded-full bg-white" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-600" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer: Priority Focus Action */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-white/5 dark:border-white/10">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider shrink-0">
              Today's Focus:
            </span>
            {focusGoal ? (
              <span className="text-sm font-bold text-gray-900 dark:text-white truncate">
                {focusGoal.title}
                {focusGoal.target ? ` • ${focusGoal.target}` : ''}
              </span>
            ) : allGoalsDone ? (
              <span className="text-sm font-bold text-emerald-500 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                All scheduled goals completed for today!
              </span>
            ) : (
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Create a daily goal to direct your energy today.
              </span>
            )}
          </div>

          <div className="shrink-0">
            {focusGoal ? (
              <button
                onClick={() => navigate('/activity')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-indigo-600/20 transition-all active:scale-95"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <Link
                to="/activity"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider border border-white/10 transition-all hover:no-underline"
              >
                <span>Activity Hub</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ActivityMomentumBanner;
