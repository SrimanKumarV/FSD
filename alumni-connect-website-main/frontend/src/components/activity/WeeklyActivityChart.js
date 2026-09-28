import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';

const WeeklyActivityChart = ({ weeklyData, onDayClick }) => {
  const days = Array.isArray(weeklyData?.days) ? weeklyData.days : [];
  const comparison = weeklyData?.comparison || (
    weeklyData?.comparisonVsLastWeek !== undefined && weeklyData?.comparisonVsLastWeek !== null
      ? { percentChange: `${weeklyData.comparisonVsLastWeek >= 0 ? '+' : ''}${weeklyData.comparisonVsLastWeek}%` }
      : null
  );
  const activeDaysCount = weeklyData?.activeDaysCount ?? weeklyData?.activeDays ?? 0;
  const totalActivities = weeklyData?.totalActivities ?? 0;

  // Find max count for scaling height (minimum 4 for visual appeal)
  const counts = days.map(d => d.activityCount || d.count || 0);
  const maxCount = counts.length > 0 ? Math.max(...counts, 4) : 4;

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5 border border-gray-200/70 dark:border-gray-800 space-y-4 min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2 min-w-0">
        <div className="min-w-0">
          <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 truncate">
            Activity This Week
          </h4>
          <div className="flex items-baseline gap-2 mt-0.5 min-w-0">
            <span className="text-xl font-extrabold text-gray-900 dark:text-white truncate">
              {activeDaysCount} of 7 days
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate">
              ({totalActivities} activities)
            </span>
          </div>
        </div>

        {comparison?.percentChange && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20 shrink-0">
            <TrendingUp className="w-3.5 h-3.5 shrink-0" />
            <span>{comparison.percentChange} vs last week</span>
          </div>
        )}
      </div>

      {/* 7-Day Bars */}
      <div className="pt-3 pb-1 min-w-0">
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5 items-end h-28 px-0.5 min-w-0">
          {days.map((day, idx) => {
            const count = day.activityCount || 0;
            const barHeightPct = count > 0 ? Math.max(Math.round((count / maxCount) * 100), 20) : 8;
            const todayStr = new Date().toISOString().slice(0, 10);
            const isToday = day.date === todayStr;

            return (
              <div
                key={day.date}
                onClick={() => onDayClick && onDayClick(day)}
                className="flex flex-col items-center gap-1.5 group cursor-pointer min-w-0 w-full"
              >
                {/* Count indicator */}
                <span className="text-xs font-bold text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors h-4 truncate">
                  {count > 0 ? count : ''}
                </span>

                {/* Vertical Bar */}
                <div className="w-full bg-gray-100 dark:bg-gray-800/80 rounded-xl h-20 flex items-end p-1 overflow-hidden min-w-0">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${barHeightPct}%` }}
                    transition={{ duration: 0.5, delay: idx * 0.04, ease: 'easeOut' }}
                    className={`w-full rounded-lg transition-all group-hover:opacity-90 ${
                      count > 0
                        ? isToday
                          ? 'bg-gradient-to-t from-indigo-600 to-purple-500 shadow-xs'
                          : 'bg-gradient-to-t from-indigo-500 to-blue-400'
                        : 'bg-gray-200 dark:bg-gray-700/50'
                    }`}
                  />
                </div>

                {/* Day Label */}
                <div className="flex flex-col items-center min-w-0">
                  <span className={`text-xs font-bold truncate ${isToday ? 'text-indigo-600 dark:text-indigo-400 font-extrabold' : 'text-gray-500 dark:text-gray-400'}`}>
                    {day.dayName}
                  </span>
                  {day.active && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-0.5 shrink-0" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WeeklyActivityChart;
