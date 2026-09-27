import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Flame, 
  Code, 
  BookOpen, 
  Globe, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle,
  Trophy,
  ChevronRight
} from 'lucide-react';
import PlatformIcon from '../PlatformIcon';

const DashboardStreaks = ({ activity }) => {
  const overall = activity?.overallStreak || {};
  const catStreaks = activity?.categoryStreaks || {};
  const platforms = Array.isArray(activity?.integrations?.platforms) 
    ? activity.integrations.platforms.filter(p => p.connected || (p.activityCount > 0)) 
    : [];

  const categories = [
    { key: 'coding', name: 'Coding', icon: Code, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
    { key: 'learning', name: 'Learning', icon: BookOpen, color: 'text-violet-500 bg-violet-500/10 border-violet-500/20' },
    { key: 'project', name: 'Projects', icon: Globe, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
    { key: 'career', name: 'Career', icon: TrendingUp, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
  ];

  const currentOverall = overall.current || 0;
  const longestOverall = overall.longest || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="glass-card rounded-2xl overflow-hidden border border-white/5 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex flex-col justify-between"
    >
      <div>
        {/* Header */}
        <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500">
              <Flame className="w-5 h-5 fill-amber-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Your Streaks
              </h2>
            </div>
          </div>
          <Link
            to="/activity"
            className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline"
          >
            View all →
          </Link>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Overall Streak Hero Row */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500 shadow-inner">
                <Flame className={`w-6 h-6 ${currentOverall > 0 ? 'fill-amber-500 animate-pulse' : 'text-gray-400'}`} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-500 dark:text-amber-400">
                  Overall Streak
                </p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-gray-900 dark:text-white">
                    {currentOverall}
                  </span>
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    day{currentOverall === 1 ? '' : 's'}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/40 dark:bg-white/5 border border-white/10 text-gray-700 dark:text-gray-300 inline-flex items-center gap-1">
                <Trophy className="w-3 h-3 text-amber-500" />
                Best: {longestOverall}d
              </span>
              {overall.activeToday ? (
                <p className="text-[11px] font-medium text-emerald-500 mt-1 flex items-center justify-end gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Logged today
                </p>
              ) : overall.atRisk ? (
                <p className="text-[11px] font-bold text-amber-500 mt-1 flex items-center justify-end gap-1 animate-pulse">
                  <AlertTriangle className="w-3 h-3" /> Streak at risk
                </p>
              ) : null}
            </div>
          </div>

          {/* Category Streaks Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {categories.map(({ key, name, icon: Icon, color }) => {
              const catData = catStreaks[key] || {};
              const streak = catData.current || 0;
              const isActiveToday = catData.activeToday || false;

              return (
                <div
                  key={key}
                  className="p-3 rounded-xl bg-white/40 dark:bg-white/[0.02] border border-gray-200/50 dark:border-gray-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`p-1.5 rounded-lg border ${color} flex-shrink-0`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">
                        {name}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {isActiveToday ? '✓ Active today' : 'Pending'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-sm font-black text-gray-900 dark:text-white">
                      {streak}
                    </span>
                    <span className="text-[10px] text-gray-400 ml-0.5">d</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Connected Platform Streaks (Section 11) */}
          {platforms.length > 0 && (
            <div className="pt-2 border-t border-gray-100 dark:border-gray-800/60">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
                Connected Platforms
              </p>
              <div className="flex flex-wrap gap-2">
                {platforms.slice(0, 4).map((p) => (
                  <div
                    key={p.platform}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800/80 border border-gray-200/60 dark:border-gray-700/60 text-xs"
                  >
                    <PlatformIcon platform={p.platform} className="w-3.5 h-3.5" />
                    <span className="capitalize font-semibold text-gray-700 dark:text-gray-300">
                      {p.platform}
                    </span>
                    {(p.currentStreak || p.streak || 0) > 0 && (
                      <span className="inline-flex items-center text-amber-500 font-bold text-[10px]">
                        🔥 {p.currentStreak || p.streak}
                      </span>
                    )}
                  </div>
                ))}
                {platforms.length > 4 && (
                  <span className="text-xs text-gray-400 self-center">
                    +{platforms.length - 4} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Link */}
      <div className="p-6 pt-0">
        <Link
          to="/activity"
          className="block w-full text-center text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-white py-2.5 border border-primary-200 dark:border-primary-800 rounded-xl hover:bg-primary-600 transition-all duration-300 hover:no-underline"
        >
          View All Streaks →
        </Link>
      </div>
    </motion.div>
  );
};

export default DashboardStreaks;
