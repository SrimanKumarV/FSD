import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Check, Flame, Sparkles } from 'lucide-react';

const MilestoneTimeline = ({ milestoneData, currentStreak = 0 }) => {
  const milestones = milestoneData?.all || [7, 14, 21, 30, 50, 75, 100, 150, 200, 365];
  const achieved = milestoneData?.achieved || [];
  const next = milestoneData?.next;
  const daysRemaining = milestoneData?.daysRemaining ?? 0;
  const progressToNext = milestoneData?.progressToNext ?? 0;

  return (
    <div className="glass-card rounded-2xl p-6 border border-gray-200/50 dark:border-gray-800 space-y-6">
      {/* Header with next target banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Habit Milestones</span>
          </h4>
          <p className="text-xl font-extrabold text-gray-900 dark:text-white mt-1">
            {next ? (
              <span>Next Goal: <strong className="text-indigo-600 dark:text-indigo-400">{next}-Day</strong> Milestone</span>
            ) : (
              <span>All major milestones conquered! 👑</span>
            )}
          </p>
        </div>

        {next && (
          <div className="flex items-center gap-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 px-4 py-2.5 rounded-2xl">
            <Flame className="w-5 h-5 text-amber-500 fill-amber-500 animate-pulse" />
            <div>
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Remaining</span>
              <p className="text-sm font-black text-indigo-600 dark:text-indigo-400">{daysRemaining} day{daysRemaining === 1 ? '' : 's'} to go</p>
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar towards Next Milestone */}
      {next && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold text-gray-500 dark:text-gray-400">
            <span>Progress to {next} days</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">{progressToNext}%</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-800 h-2.5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressToNext}%` }}
              transition={{ duration: 0.8 }}
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
            />
          </div>
        </div>
      )}

      {/* Milestones Track */}
      <div className="overflow-x-auto pb-2">
        <div className="flex items-center justify-between min-w-[580px] gap-2 pt-2">
          {milestones.map((m, idx) => {
            const isAchieved = currentStreak >= m;
            const isNext = m === next;

            return (
              <div key={m} className="flex-1 flex flex-col items-center relative group">
                {/* Connecting Line */}
                {idx < milestones.length - 1 && (
                  <div
                    className={`absolute top-4 left-1/2 w-full h-1 -translate-y-1/2 z-0 ${
                      currentStreak >= milestones[idx + 1]
                        ? 'bg-emerald-500'
                        : isAchieved
                        ? 'bg-gradient-to-r from-emerald-500 to-gray-200 dark:to-gray-800'
                        : 'bg-gray-200 dark:bg-gray-800'
                    }`}
                  />
                )}

                {/* Milestone Node */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black relative z-10 transition-all ${
                    isAchieved
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                      : isNext
                      ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/20 shadow-md shadow-indigo-500/30 animate-bounce'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {isAchieved ? <Check className="w-4 h-4 stroke-[3]" /> : m}
                </div>

                {/* Label */}
                <span className={`text-[11px] font-bold mt-2 ${
                  isAchieved
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : isNext
                    ? 'text-indigo-600 dark:text-indigo-400 font-extrabold'
                    : 'text-gray-400'
                }`}>
                  {m}d
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MilestoneTimeline;
