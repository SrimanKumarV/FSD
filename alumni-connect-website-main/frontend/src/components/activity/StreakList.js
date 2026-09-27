import React from 'react';
import { Flame, Code, BookOpen, Globe, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import PlatformIcon from '../PlatformIcon';

const StreakList = ({ overallStreak, categoryStreaks, integrations, isCompact = false }) => {
  const categories = [
    { key: 'coding', name: 'Coding', icon: Code, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
    { key: 'learning', name: 'Learning', icon: BookOpen, color: 'text-violet-500 bg-violet-500/10 border-violet-500/20' },
    { key: 'project', name: 'Projects', icon: Globe, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
    { key: 'career', name: 'Career', icon: TrendingUp, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
  ];

  const platforms = integrations?.platforms || [];

  return (
    <div className="space-y-4">
      {/* Top Level Cards */}
      <div className={`grid ${isCompact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'} gap-3`}>
        {/* Overall Streak Card */}
        <div className="glass-card rounded-2xl p-4 flex flex-col justify-between border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Overall</span>
            <Flame className={`w-4 h-4 ${overallStreak?.current > 0 ? 'text-amber-500 fill-amber-500 animate-pulse' : 'text-gray-400'}`} />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-gray-900 dark:text-white">{overallStreak?.current ?? 0}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">days</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px]">
            {overallStreak?.activeToday ? (
              <span className="text-emerald-500 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3 h-3" /> Active today
              </span>
            ) : overallStreak?.atRisk ? (
              <span className="text-amber-500 flex items-center gap-1 font-medium">
                <AlertTriangle className="w-3 h-3" /> At risk
              </span>
            ) : (
              <span className="text-gray-400">Not active</span>
            )}
            <span className="text-gray-400 font-medium">Best {overallStreak?.longest ?? 0}d</span>
          </div>
        </div>

        {/* Category Cards */}
        {categories.map(({ key, name, icon: Icon, color }) => {
          const streakData = categoryStreaks?.[key];
          const current = streakData?.current ?? 0;
          const activeToday = streakData?.activeToday ?? false;
          const atRisk = streakData?.atRisk ?? false;

          return (
            <div key={key} className="glass-card rounded-2xl p-4 flex flex-col justify-between border border-gray-200/50 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{name}</span>
                <div className={`p-1.5 rounded-lg border ${color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-gray-900 dark:text-white">{current}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">days</span>
              </div>
              <div className="mt-1 text-[11px]">
                {activeToday ? (
                  <span className="text-emerald-500 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Logged today
                  </span>
                ) : atRisk ? (
                  <span className="text-amber-500 font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Pending today
                  </span>
                ) : (
                  <span className="text-gray-400">0 days active</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Platform Streaks if available */}
      {platforms.length > 0 && !isCompact && (
        <div className="pt-2">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">Connected Platform Streaks</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {platforms.map(p => (
              <div key={p.platform} className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 flex items-center justify-center">
                    <PlatformIcon platform={p.platform} className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{p.info?.name || p.platform}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Flame className={`w-3.5 h-3.5 ${p.currentStreak > 0 ? 'text-amber-500 fill-amber-500' : 'text-gray-400'}`} />
                  <span className="text-xs font-bold text-gray-900 dark:text-white">{p.currentStreak ?? '—'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StreakList;
