import React from 'react';
import { Trophy, Calendar, Zap, Award, BarChart2 } from 'lucide-react';

const PersonalRecords = ({ records }) => {
  const items = [
    { 
      label: 'Longest Streak', 
      value: `${records?.longestOverallStreak || 0} days`, 
      subtitle: 'All-time best run',
      icon: Trophy, 
      color: 'text-amber-500 bg-amber-500/10' 
    },
    { 
      label: 'Verified Activities', 
      value: `${records?.totalActivities || 0}`, 
      subtitle: 'Platform verified events',
      icon: Zap, 
      color: 'text-indigo-500 bg-indigo-500/10' 
    },
    { 
      label: 'Active Days', 
      value: `${records?.totalActiveDays || 0} days`, 
      subtitle: 'Recorded active days',
      icon: Calendar, 
      color: 'text-emerald-500 bg-emerald-500/10' 
    },
    { 
      label: 'Most Productive Day', 
      value: records?.mostActiveDayOfWeek || 'Sunday', 
      subtitle: 'Peak momentum day',
      icon: Award, 
      color: 'text-purple-500 bg-purple-500/10' 
    },
    { 
      label: 'Top Platform', 
      value: records?.mostConsistentPlatform || 'LeetCode', 
      subtitle: 'Highest activity source',
      icon: BarChart2, 
      color: 'text-blue-500 bg-blue-500/10' 
    },
  ];

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-6 border border-gray-200/50 dark:border-gray-800 space-y-4 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
          <span>Personal Records</span>
        </h4>
        <span className="text-[11px] text-gray-400 font-semibold">All-time milestones</span>
      </div>

      {/* DevPulse-style responsive grid: 1 col on mobile, 2 col on sm, 3 col on md/lg, 5 col on xl */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-3.5 min-w-0">
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div 
              key={idx} 
              className="p-3.5 sm:p-4 rounded-xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-200/50 dark:border-gray-700/50 flex flex-col justify-between min-w-0 transition-all hover:border-gray-300 dark:hover:border-gray-600"
            >
              <div className="flex items-start justify-between gap-2 mb-2 min-w-0">
                <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider leading-snug break-words">
                  {item.label}
                </span>
                <div className={`p-2 rounded-lg ${item.color} shrink-0`}>
                  <Icon className="w-4 h-4 shrink-0" />
                </div>
              </div>

              <div className="mt-1 min-w-0">
                <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white truncate">
                  {item.value}
                </p>
                {item.subtitle && (
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate mt-0.5 font-medium">
                    {item.subtitle}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PersonalRecords;
