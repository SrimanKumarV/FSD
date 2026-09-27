import React from 'react';
import { motion } from 'framer-motion';
import { Flame, ArrowRight, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const ActivityMomentumCard = ({ activityData, userName = 'there', onContinuePlan, isCompact = false }) => {
  const overallStreak = activityData?.overallStreak?.current ?? 0;
  const longestStreak = activityData?.overallStreak?.longest ?? 0;
  const isAtRisk = activityData?.overallStreak?.atRisk ?? false;
  const activeToday = activityData?.overallStreak?.activeToday ?? false;

  const totalGoals = activityData?.todaysPlan?.total ?? activityData?.today?.totalGoals ?? 0;
  const completedGoals = activityData?.todaysPlan?.completed ?? activityData?.today?.completedGoals ?? 0;
  const remainingGoals = Math.max(totalGoals - completedGoals, 0);
  const percentage = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 p-6 md:p-8 text-white shadow-xl border border-indigo-700/40"
    >
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-60 h-60 bg-purple-500/15 rounded-full blur-2xl translate-y-1/2 pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left Column: Greeting & Streak */}
        <div className="space-y-3 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold uppercase tracking-wider text-amber-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Activity Intelligence</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Good day, {userName?.split(' ')[0] || 'Friend'} 👋
          </h2>

          <p className="text-indigo-100 text-sm md:text-base leading-relaxed">
            {overallStreak > 0
              ? activeToday
                ? `You've locked in your momentum for today! Current streak is burning strong.`
                : `You're building momentum. Complete today's plan to protect your streak!`
              : `Start building your daily consistency. One small action today builds massive momentum.`}
          </p>

          {/* Streak Badge & Status */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/15 shadow-inner">
              <Flame className={`w-6 h-6 ${overallStreak > 0 ? 'text-amber-400 fill-amber-400 animate-pulse' : 'text-gray-400'}`} />
              <div>
                <span className="text-xl font-black text-white">{overallStreak}</span>
                <span className="text-xs text-indigo-200 ml-1.5 font-medium">day overall streak</span>
              </div>
            </div>

            {longestStreak > 0 && (
              <span className="text-xs text-indigo-200 font-medium px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
                Best: <strong className="text-white">{longestStreak} days</strong>
              </span>
            )}

            {isAtRisk && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 bg-amber-500/20 px-3 py-1.5 rounded-xl border border-amber-500/30 animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5" />
                Streak at risk today
              </span>
            )}
          </div>
        </div>

        {/* Right Column: Today's Goals Progress Box */}
        <div className="flex flex-col justify-center bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/15 min-w-[260px] md:max-w-xs shadow-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">Today's Progress</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white/15 text-white">
              {completedGoals} / {totalGoals}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-black/25 h-3.5 rounded-full overflow-hidden p-0.5 mb-3 border border-white/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`h-full rounded-full ${
                percentage === 100
                  ? 'bg-gradient-to-r from-emerald-400 to-teal-300'
                  : 'bg-gradient-to-r from-amber-400 via-orange-400 to-emerald-400'
              }`}
            />
          </div>

          <div className="flex items-center justify-between text-xs mb-4">
            <span className="text-indigo-200">
              {totalGoals === 0
                ? 'No goals set for today'
                : remainingGoals === 0
                ? 'All goals completed! 🎉'
                : `${remainingGoals} goal${remainingGoals > 1 ? 's' : ''} remaining`}
            </span>
            <span className="font-bold text-white">{percentage}%</span>
          </div>

          {/* CTA */}
          {onContinuePlan ? (
            <button
              onClick={onContinuePlan}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white text-indigo-900 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-indigo-50 active:scale-95 transition-all shadow-md"
            >
              <span>Continue Today's Plan</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <Link
              to="/activity"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white text-indigo-900 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-indigo-50 active:scale-95 transition-all shadow-md hover:no-underline"
            >
              <span>Open Activity Hub</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ActivityMomentumCard;
