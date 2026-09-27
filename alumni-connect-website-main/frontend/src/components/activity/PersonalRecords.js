import React from 'react';
import { Trophy, Calendar, Zap, Award, BarChart2 } from 'lucide-react';

export const PersonalRecords = ({ records }) => {
  const items = [
    { 
      label: 'Longest Streak', 
      value: `${records?.longestOverallStreak || 0} Days`, 
      subtitle: 'All-time best run',
      icon: Trophy, 
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' 
    },
    { 
      label: 'Verified Activities', 
      value: `${records?.totalActivities || 0}`, 
      subtitle: 'Platform verified events',
      icon: Zap, 
      color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20' 
    },
    { 
      label: 'Active Days', 
      value: `${records?.totalActiveDays || 0} Days`, 
      subtitle: 'Recorded active days',
      icon: Calendar, 
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' 
    },
    { 
      label: 'Peak Productive Day', 
      value: records?.mostActiveDayOfWeek || 'Sunday', 
      subtitle: 'Peak momentum day',
      icon: Award, 
      color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' 
    },
    { 
      label: 'Top Platform', 
      value: records?.mostConsistentPlatform || 'LeetCode', 
      subtitle: 'Highest activity source',
      icon: BarChart2, 
      color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' 
    },
  ];

  return (
    <div className="glass-card rounded-2xl p-5 sm:p-6 border border-gray-200/60 dark:border-gray-800 space-y-4 min-w-0 w-full shadow-sm">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
          <span>Personal Records</span>
        </h4>
        <span className="text-xs text-gray-400 font-medium">All-time milestones & achievements</span>
      </div>

      {/* 
        Responsive Grid:
        - 1 col on mobile (<640px)
        - 2 cols on tablet (sm: 640px - 1023px)
        - 3 cols on laptop/desktop (lg: 1024px - 1535px) - ample room (~300px+ per card)
        - 5 cols on ultra-wide screens (2xl: >= 1536px)
      */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-3.5 sm:gap-4 min-w-0">
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div 
              key={idx} 
              className="p-4 sm:p-4.5 rounded-xl bg-white/70 dark:bg-gray-800/40 border border-gray-200/60 dark:border-gray-700/50 flex flex-col justify-between min-w-0 transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-3 mb-3 min-w-0">
                <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider leading-snug line-clamp-1">
                  {item.label}
                </span>
                <div className={`p-2 rounded-lg border ${item.color} shrink-0 flex items-center justify-center`}>
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                </div>
              </div>

              <div className="mt-1 min-w-0">
                <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight break-words">
                  {item.value}
                </p>
                {item.subtitle && (
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate mt-1 font-medium">
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
