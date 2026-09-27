import React from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, 
  Lightbulb, 
  Trophy, 
  ArrowRight, 
  Flame, 
  CheckCircle2 
} from 'lucide-react';

const DashboardMomentumInsight = ({ activity }) => {
  const navigate = useNavigate();
  const overall = activity?.overallStreak || {};
  const currentStreak = overall.current || 0;
  const isAtRisk = overall.atRisk && currentStreak > 0;

  const insights = Array.isArray(activity?.insights) ? activity.insights : [];
  const topInsight = insights[0];
  const personalRecords = activity?.personalRecords;

  // 1. Priority 1: Streak at Risk Warning Banner
  if (isAtRisk) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-amber-500/5"
      >
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-500 border border-amber-500/30 flex-shrink-0 animate-pulse">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-500 dark:text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
              <span>Streak At Risk</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
            </h4>
            <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-200 mt-0.5">
              Your <strong>{currentStreak}-day activity streak</strong> is pending today. Complete today's priority goal before the end of the day to keep your streak alive!
            </p>
          </div>
        </div>

        <Link
          to="/activity"
          className="flex-shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-gray-950 font-bold text-xs uppercase tracking-wider shadow-md transition-all active:scale-95 hover:no-underline"
        >
          <span>Continue Goal</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </motion.div>
    );
  }

  // 2. Priority 2: High Value Momentum Insight from Real Data
  if (topInsight) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex-shrink-0">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Momentum Insight
            </h4>
            <p className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 font-semibold mt-0.5">
              {topInsight.title}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
              {topInsight.description}
            </p>
          </div>
        </div>

        <Link
          to="/activity"
          className="flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-500 dark:text-indigo-400 hover:text-indigo-300 transition-colors hover:no-underline"
        >
          <span>View Insights</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </motion.div>
    );
  }

  // 3. Fallback: Personal Record Highlight if underlying data exists (Section 15)
  if (personalRecords && personalRecords.longestOverallStreak > 0) {
    const daysToGo = Math.max(personalRecords.longestOverallStreak - currentStreak, 0);
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-4 bg-purple-500/10 border border-purple-500/20 flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-purple-400">Personal Record</p>
            <p className="text-xs text-gray-300">
              Longest streak: <strong className="text-white">{personalRecords.longestOverallStreak} days</strong>.
              {daysToGo > 0 ? ` ${daysToGo} day${daysToGo > 1 ? 's' : ''} to beat your record!` : ' You are at your all-time peak!'}
            </p>
          </div>
        </div>
        <Link to="/activity" className="text-xs font-bold text-purple-400 hover:underline flex items-center gap-1">
          Explore Hub <ArrowRight className="w-3 h-3" />
        </Link>
      </motion.div>
    );
  }

  // If no insight data yet, don't show an empty card
  return null;
};

export default DashboardMomentumInsight;
