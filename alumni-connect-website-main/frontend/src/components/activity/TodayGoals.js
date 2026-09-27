import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, Clock, Zap, ShieldCheck, Flame, ChevronRight,
  Code, BookOpen, Globe, TrendingUp, Target, Plus, AlertCircle
} from 'lucide-react';
import PlatformIcon from '../PlatformIcon';

const categoryIcons = {
  coding: Code,
  learning: BookOpen,
  project: Globe,
  career: TrendingUp,
  custom: Target
};

const TodayGoals = ({
  goals = [],
  onCompleteGoal,
  onOpenCreateGoal,
  maxDisplay = null,
  showFilters = false
}) => {
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'completed'

  const filteredGoals = goals.filter(g => {
    if (filter === 'pending') return !g.completedToday;
    if (filter === 'completed') return g.completedToday;
    return true;
  });

  const displayGoals = maxDisplay ? filteredGoals.slice(0, maxDisplay) : filteredGoals;

  if (goals.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center border border-dashed border-gray-300 dark:border-gray-700">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 flex items-center justify-center mx-auto mb-3">
          <Target className="w-6 h-6" />
        </div>
        <h4 className="text-base font-bold text-gray-900 dark:text-white">No Goals for Today</h4>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
          Set up your first daily goal to automatically track your coding, learning, and projects.
        </p>
        {onOpenCreateGoal && (
          <button
            onClick={onOpenCreateGoal}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create Goal</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Optional Filters */}
      {showFilters && (
        <div className="flex items-center justify-between gap-2 pb-1">
          <div className="flex gap-1.5 p-1 bg-gray-100 dark:bg-gray-800/60 rounded-xl">
            {[
              { id: 'all', label: 'All' },
              { id: 'pending', label: 'Incomplete' },
              { id: 'completed', label: 'Completed' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  filter === tab.id
                    ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {onOpenCreateGoal && (
            <button
              onClick={onOpenCreateGoal}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Goal</span>
            </button>
          )}
        </div>
      )}

      {/* Goal Items */}
      <div className="space-y-2.5">
        <AnimatePresence>
          {displayGoals.map(goal => {
            const isCompleted = goal.completedToday;
            const CategoryIcon = categoryIcons[goal.category] || Target;
            const isAuto = goal.trackingMode === 'automatic' || goal.completionType === 'api-verified' || goal.completionType === 'auto-detected';

            return (
              <motion.div
                key={goal._id || goal.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  isCompleted
                    ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/30'
                    : goal.priority === 'high'
                    ? 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/30 shadow-sm'
                    : 'glass-card border-gray-200/60 dark:border-gray-800 hover:border-indigo-500/30'
                }`}
              >
                {/* Left: Check Button & Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => !isCompleted && onCompleteGoal && onCompleteGoal(goal._id || goal.id)}
                    disabled={isCompleted}
                    title={isCompleted ? 'Completed' : 'Click to complete'}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
                      isCompleted
                        ? 'bg-emerald-500 text-white cursor-default shadow-md shadow-emerald-500/20'
                        : 'border-2 border-gray-300 dark:border-gray-600 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-transparent hover:text-indigo-500'
                    }`}
                  >
                    <Check className={`w-4 h-4 stroke-[3] ${isCompleted ? 'text-white' : 'text-current'}`} />
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-bold truncate ${isCompleted ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                        {goal.title}
                      </span>

                      {/* Verification/Tracking Badge */}
                      {isCompleted ? (
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          goal.completionType === 'api-verified'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                        }`}>
                          <ShieldCheck className="w-3 h-3" />
                          {goal.completionType === 'api-verified' ? 'API Verified' : 'Completed'}
                        </span>
                      ) : isAuto ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                          <Zap className="w-2.5 h-2.5 text-amber-500" />
                          Auto Track
                        </span>
                      ) : null}

                      {/* Priority Badge */}
                      {!isCompleted && goal.priority === 'high' && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400">
                          High Priority
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {goal.platform && goal.platform !== 'custom' ? (
                        <span className="flex items-center gap-1">
                          <PlatformIcon platform={goal.platform} className="w-3 h-3" />
                          <span className="capitalize">{goal.platform}</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 capitalize">
                          <CategoryIcon className="w-3 h-3" />
                          {goal.category}
                        </span>
                      )}

                      {goal.target && (
                        <span>• {goal.target}</span>
                      )}

                      {goal.estimatedMinutes && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {goal.estimatedMinutes}m
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Streak status */}
                <div className="flex items-center gap-2 flex-shrink-0 text-right">
                  {(goal.currentStreak || 0) > 0 && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold">
                      <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{goal.currentStreak}d</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TodayGoals;
