import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Target, 
  Check, 
  Clock, 
  ShieldCheck, 
  Zap, 
  Flame, 
  ArrowRight, 
  Plus, 
  Code, 
  BookOpen, 
  Globe, 
  TrendingUp,
  CheckCircle2
} from 'lucide-react';
import PlatformIcon from '../PlatformIcon';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const categoryIcons = {
  coding: Code,
  learning: BookOpen,
  project: Globe,
  career: TrendingUp,
  custom: Target
};

const DashboardTodayGoals = ({ activity, onGoalCompleted }) => {
  const [completingId, setCompletingId] = useState(null);
  const [localCompletedMap, setLocalCompletedMap] = useState({});

  const goalsList = Array.isArray(activity?.todaysPlan?.goals)
    ? activity.todaysPlan.goals
    : Array.isArray(activity?.todaysGoals?.goals)
    ? activity.todaysGoals.goals
    : [];

  const handleComplete = async (goalId) => {
    try {
      setCompletingId(goalId);
      // Optimistic local state update
      setLocalCompletedMap(prev => ({ ...prev, [goalId]: true }));

      const res = await api.post(`/activity/goals/${goalId}/complete`);
      if (res.data?.alreadyCompleted) {
        toast('Already completed today!', { icon: '✅' });
      } else {
        toast.success('Goal completed! Keep going! 🎉');
      }

      if (onGoalCompleted) {
        onGoalCompleted(goalId);
      }
    } catch (err) {
      console.error('Goal complete error:', err);
      // Rollback optimistic state on error
      setLocalCompletedMap(prev => ({ ...prev, [goalId]: false }));
      toast.error(err.response?.data?.message || 'Failed to complete goal');
    } finally {
      setCompletingId(null);
    }
  };

  const displayLimit = 4;
  const visibleGoals = goalsList.slice(0, displayLimit);
  const extraCount = Math.max(goalsList.length - displayLimit, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="glass-card rounded-2xl overflow-hidden border border-white/5 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex flex-col justify-between"
    >
      <div>
        {/* Card Header */}
        <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Today's Goals
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
        <div className="p-6">
          {goalsList.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500 flex items-center justify-center mx-auto mb-3">
                <Target className="w-6 h-6 opacity-60" />
              </div>
              <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                Start your momentum
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 max-w-xs mx-auto">
                Create your first activity goal to track your coding, learning, and projects.
              </p>
              <Link
                to="/activity"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 hover:no-underline"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Goal</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {visibleGoals.map((goal) => {
                  const goalId = goal._id || goal.id;
                  const isCompleted = !!(goal.completedToday || localCompletedMap[goalId]);
                  const CategoryIcon = categoryIcons[goal.category] || Target;
                  const isAuto = goal.trackingMode === 'automatic' || 
                    goal.completionType === 'api-verified' || 
                    goal.completionType === 'auto-detected';

                  return (
                    <motion.div
                      key={goalId}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        isCompleted
                          ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/30'
                          : goal.priority === 'high'
                          ? 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/30'
                          : 'bg-white/40 dark:bg-white/[0.02] border-gray-200/50 dark:border-gray-800 hover:border-indigo-500/30'
                      }`}
                    >
                      {/* Left: Checkmark & Title */}
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          type="button"
                          onClick={() => !isCompleted && handleComplete(goalId)}
                          disabled={isCompleted || completingId === goalId}
                          title={isCompleted ? 'Completed today' : 'Click to complete'}
                          className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
                            isCompleted
                              ? 'bg-emerald-500 text-white cursor-default shadow-sm shadow-emerald-500/30'
                              : 'border-2 border-gray-300 dark:border-gray-600 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-transparent hover:text-indigo-500 cursor-pointer'
                          }`}
                        >
                          <Check className={`w-3.5 h-3.5 stroke-[3] ${isCompleted ? 'text-white' : 'text-current'}`} />
                        </button>

                        <div className="min-w-0">
                          <p className={`text-sm font-semibold truncate ${
                            isCompleted 
                              ? 'line-through text-gray-400 dark:text-gray-500' 
                              : 'text-gray-900 dark:text-white'
                          }`}>
                            {goal.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                            {goal.platform && goal.platform !== 'custom' ? (
                              <span className="flex items-center gap-1">
                                <PlatformIcon platform={goal.platform} className="w-3 h-3" />
                                <span className="capitalize">{goal.platform}</span>
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 capitalize">
                                <CategoryIcon className="w-3 h-3" />
                                {goal.category || 'Goal'}
                              </span>
                            )}
                            {goal.target && (
                              <span>• {goal.target}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Status badge */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {isCompleted ? (
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            goal.completionType === 'api-verified'
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                              : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          }`}>
                            <ShieldCheck className="w-3 h-3" />
                            {goal.completionType === 'api-verified' ? 'Verified' : 'Completed'}
                          </span>
                        ) : isAuto ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                            <Zap className="w-2.5 h-2.5 text-amber-500" />
                            Auto
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-gray-400 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800">
                            Pending
                          </span>
                        )}

                        {(goal.currentStreak || 0) > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-500">
                            <Flame className="w-3 h-3 fill-amber-500" />
                            {goal.currentStreak}d
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {extraCount > 0 && (
                <p className="text-center text-xs font-semibold text-gray-400 dark:text-gray-500 pt-1">
                  + {extraCount} more scheduled goal{extraCount > 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Card Footer Link */}
      <div className="p-6 pt-0">
        <Link
          to="/activity"
          className="block w-full text-center text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-white py-2.5 border border-primary-200 dark:border-primary-800 rounded-xl hover:bg-primary-600 transition-all duration-300 hover:no-underline"
        >
          View All Goals →
        </Link>
      </div>
    </motion.div>
  );
};

export default DashboardTodayGoals;
