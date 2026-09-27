import React from 'react';
import { Shield, Flame, AlertTriangle, Info, Clock, CheckCircle2 } from 'lucide-react';

const StreakProtectionCard = ({ overallStreak, categoryStreaks, timezone = 'Asia/Kolkata' }) => {
  const atRiskCount = (overallStreak?.atRisk ? 1 : 0) +
    Object.values(categoryStreaks || {}).filter(s => s.atRisk).length;

  return (
    <div className="glass-card rounded-2xl p-6 border border-gray-200/50 dark:border-gray-800 space-y-5">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-2">
          <Shield className="w-4 h-4 text-indigo-500" />
          <span>Streak Protection Center</span>
        </h4>
        <span className="text-xs text-gray-400 font-medium">TZ: {timezone}</span>
      </div>

      {/* Grid of Streak Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200/50 dark:border-gray-700/50">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Overall Streak</span>
          <div className="mt-1 flex items-center gap-1.5">
            <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />
            <span className="text-xl font-black text-gray-900 dark:text-white">{overallStreak?.current ?? 0}d</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200/50 dark:border-gray-700/50">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Streaks at Risk</span>
          <div className="mt-1 flex items-center gap-1.5">
            <AlertTriangle className={`w-5 h-5 ${atRiskCount > 0 ? 'text-amber-500' : 'text-gray-400'}`} />
            <span className={`text-xl font-black ${atRiskCount > 0 ? 'text-amber-500' : 'text-gray-900 dark:text-white'}`}>{atRiskCount}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200/50 dark:border-gray-700/50">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Protected Today</span>
          <div className="mt-1 flex items-center gap-1.5">
            <CheckCircle2 className={`w-5 h-5 ${overallStreak?.activeToday ? 'text-emerald-500' : 'text-gray-400'}`} />
            <span className="text-xl font-black text-gray-900 dark:text-white">{overallStreak?.activeToday ? 'Yes' : 'Pending'}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200/50 dark:border-gray-700/50">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">All-Time Best</span>
          <div className="mt-1 flex items-center gap-1.5">
            <Flame className="w-5 h-5 text-indigo-400" />
            <span className="text-xl font-black text-gray-900 dark:text-white">{overallStreak?.longest ?? 0}d</span>
          </div>
        </div>
      </div>

      {/* Transparent Rules Explainer */}
      <div className="p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 text-xs text-gray-600 dark:text-gray-400 space-y-1.5">
        <p className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-indigo-500" />
          <span>How Streaks Work in Alumnex Connect</span>
        </p>
        <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] text-gray-500 dark:text-gray-400">
          <li>An overall active day is recorded whenever at least one verified activity or goal is completed.</li>
          <li>Dates are strictly computed in your local timezone ({timezone}) without relying on UTC shifts.</li>
          <li>Streaks do not break during quiet hours; you have until midnight in your local timezone to complete an activity.</li>
        </ul>
      </div>
    </div>
  );
};

export default StreakProtectionCard;
