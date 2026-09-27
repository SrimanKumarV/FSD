import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  CheckCircle2, 
  Clock,
  Activity
} from 'lucide-react';

const DashboardWeeklyActivity = ({ activity }) => {
  const weekly = activity?.weekly || {};
  const days = Array.isArray(weekly?.days) ? weekly.days : [];
  const activeDaysCount = weekly?.activeDaysCount ?? days.filter(d => d.active).length;
  const totalActivities = weekly?.totalActivities ?? days.reduce((acc, d) => acc + (d.activityCount || 0), 0);
  const comparison = weekly?.comparison;

  const counts = days.map(d => d.activityCount || (d.active ? 1 : 0));
  const maxCount = counts.length > 0 ? Math.max(...counts, 4) : 4;

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
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Activity This Week
              </h2>
            </div>
          </div>
          <Link
            to="/activity"
            className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline"
          >
            View Analytics →
          </Link>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Active Days Summary */}
          <div className="flex items-baseline justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
                  {activeDaysCount} of 7
                </span>
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  days active
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {totalActivities} total verified activit{totalActivities === 1 ? 'y' : 'ies'} this week
              </p>
            </div>

            {comparison?.percentChange && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <TrendingUp className="w-3.5 h-3.5" />
                {comparison.percentChange} vs last week
              </span>
            )}
          </div>

          {/* Mini Bar Chart */}
          {days.length > 0 ? (
            <div className="pt-2">
              <div className="grid grid-cols-7 gap-2 sm:gap-3 items-end h-28 px-1">
                {days.map((day, idx) => {
                  const count = day.activityCount || (day.active ? 1 : 0);
                  const barHeightPct = count > 0 ? Math.max(Math.round((count / maxCount) * 100), 25) : 8;
                  const isToday = idx === days.length - 1;

                  return (
                    <div
                      key={day.date || idx}
                      className="flex flex-col items-center gap-1.5 group cursor-default"
                      title={`${day.dayName} (${day.date}): ${count} activities`}
                    >
                      {/* Count tooltip on hover */}
                      <span className="text-[10px] font-bold text-gray-400 group-hover:text-indigo-500 transition-colors h-3.5">
                        {count > 0 ? count : ''}
                      </span>

                      {/* Bar */}
                      <div className="w-full bg-gray-100 dark:bg-gray-800/80 rounded-lg h-20 flex items-end p-1 overflow-hidden">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${barHeightPct}%` }}
                          transition={{ duration: 0.5, delay: idx * 0.04, ease: 'easeOut' }}
                          className={`w-full rounded-md transition-all ${
                            count > 0
                              ? isToday
                                ? 'bg-gradient-to-t from-indigo-600 to-purple-500 shadow-sm shadow-indigo-500/25'
                                : 'bg-gradient-to-t from-emerald-500 to-teal-400'
                              : 'bg-gray-200 dark:bg-gray-700/50'
                          }`}
                        />
                      </div>

                      {/* Label */}
                      <div className="flex flex-col items-center">
                        <span className={`text-[11px] font-bold ${
                          isToday 
                            ? 'text-indigo-600 dark:text-indigo-400 underline decoration-2' 
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {day.dayName?.[0] || 'D'}
                        </span>
                        {day.active && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-0.5" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No activity logged this week yet.</p>
            </div>
          )}

          {/* Category badges */}
          <div className="pt-2 border-t border-gray-100 dark:border-gray-800/60 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span className="font-semibold text-[11px] uppercase tracking-wider">Focus Areas</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold">Coding</span>
              <span className="px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[10px] font-bold">Learning</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">Projects</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Link */}
      <div className="p-6 pt-0">
        <Link
          to="/activity"
          className="block w-full text-center text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-white py-2.5 border border-primary-200 dark:border-primary-800 rounded-xl hover:bg-primary-600 transition-all duration-300 hover:no-underline"
        >
          View Full Analytics →
        </Link>
      </div>
    </motion.div>
  );
};

export default DashboardWeeklyActivity;
