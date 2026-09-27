import React from 'react';
import { Trophy, Calendar, Zap, Flame, Award, BarChart2 } from 'lucide-react';

const PersonalRecords = ({ records }) => {
  const items = [
    { label: 'Longest Streak', value: `${records?.longestOverallStreak || 0} days`, icon: Trophy, color: 'text-amber-500 bg-amber-500/10' },
    { label: 'Total Verified Activities', value: `${records?.totalActivities || 0}`, icon: Zap, color: 'text-indigo-500 bg-indigo-500/10' },
    { label: 'Total Active Days', value: `${records?.totalActiveDays || 0} days`, icon: Calendar, color: 'text-emerald-500 bg-emerald-500/10' },
    { label: 'Most Productive Day', value: records?.mostActiveDayOfWeek || '—', icon: Award, color: 'text-purple-500 bg-purple-500/10' },
    { label: 'Top Platform', value: records?.mostConsistentPlatform || '—', icon: BarChart2, color: 'text-blue-500 bg-blue-500/10' },
  ];

  return (
    <div className="glass-card rounded-2xl p-6 border border-gray-200/50 dark:border-gray-800 space-y-4">
      <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-2">
        <Trophy className="w-4 h-4 text-amber-500" />
        <span>Personal Records</span>
      </h4>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200/50 dark:border-gray-700/50 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{item.label}</span>
                <div className={`p-1.5 rounded-lg ${item.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="text-lg font-black text-gray-900 dark:text-white truncate">
                {item.value}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PersonalRecords;
