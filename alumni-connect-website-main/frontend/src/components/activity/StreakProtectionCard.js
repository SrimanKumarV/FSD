import React, { useState } from 'react';
import { Shield, Flame, AlertTriangle, Info, Clock, CheckCircle2, ChevronRight, RefreshCw } from 'lucide-react';

const StreakProtectionCard = ({
  overallStreak,
  categoryStreaks,
  timezone = 'Asia/Kolkata',
  syncFreshness = null,
  isSyncing = false
}) => {
  const [showExplainer, setShowExplainer] = useState(false);
  const atRiskCount = (overallStreak?.atRisk ? 1 : 0) +
    Object.values(categoryStreaks || {}).filter(s => s.atRisk).length;

  const isProtectedToday = overallStreak?.activeToday ?? false;
  const isDelayed = syncFreshness?.syncStatus === 'failed' || syncFreshness?.syncStatus === 'temporarily-unavailable';

  // Verification status text & color
  let verificationStatus = 'Pending';
  let verificationColor = 'text-gray-400';
  if (isProtectedToday) {
    verificationStatus = 'Verified';
    verificationColor = 'text-emerald-500';
  } else if (isSyncing) {
    verificationStatus = 'Verifying...';
    verificationColor = 'text-indigo-500 animate-pulse';
  } else if (isDelayed) {
    verificationStatus = 'Verification delayed';
    verificationColor = 'text-amber-500';
  } else if (atRiskCount > 0) {
    verificationStatus = 'Pending verification';
    verificationColor = 'text-amber-500';
  }

  // Format last verified time
  const lastSyncTime = syncFreshness?.lastSuccessfulRemoteSyncAt || syncFreshness?.lastRemoteSyncAt;
  const formatLastVerified = (timestamp) => {
    if (!timestamp) return 'Not yet synced';
    const msAgo = Date.now() - new Date(timestamp).getTime();
    const minsAgo = Math.max(0, Math.floor(msAgo / 60000));
    if (minsAgo < 1) return 'Just now';
    if (minsAgo === 1) return '1 min ago';
    if (minsAgo < 60) return `${minsAgo} mins ago`;
    const hoursAgo = Math.floor(minsAgo / 60);
    return `${hoursAgo}h ago`;
  };

  return (
    <div className="glass-card rounded-2xl p-6 border border-gray-200/50 dark:border-gray-800 space-y-5">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-2">
          <Shield className="w-4 h-4 text-indigo-500" />
          <span>Streak Protection Center</span>
        </h4>
        <span className="text-xs text-gray-400 font-medium">TZ: {timezone}</span>
      </div>

      {/* Grid of Streak Stats (Step 62: Current, Longest, Completed Today, Verification Status, Last Verified) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200/50 dark:border-gray-700/50">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Current Streak</span>
          <div className="mt-1 flex items-center gap-1.5">
            <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />
            <span className="text-xl font-black text-gray-900 dark:text-white">{overallStreak?.current ?? 0}d</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200/50 dark:border-gray-700/50">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Longest Streak</span>
          <div className="mt-1 flex items-center gap-1.5">
            <Flame className="w-5 h-5 text-indigo-400" />
            <span className="text-xl font-black text-gray-900 dark:text-white">{overallStreak?.longest ?? 0}d</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200/50 dark:border-gray-700/50">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Completed Today</span>
          <div className="mt-1 flex items-center gap-1.5">
            <CheckCircle2 className={`w-5 h-5 ${isProtectedToday ? 'text-emerald-500' : 'text-gray-400'}`} />
            <span className="text-xl font-black text-gray-900 dark:text-white">{isProtectedToday ? 'Yes' : 'Pending'}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200/50 dark:border-gray-700/50">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Verification</span>
          <div className="mt-1 flex items-center gap-1.5 truncate">
            {isSyncing ? (
              <RefreshCw className="w-4 h-4 text-indigo-500 animate-spin shrink-0" />
            ) : isDelayed ? (
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            ) : (
              <Clock className={`w-4 h-4 ${isProtectedToday ? 'text-emerald-500' : 'text-gray-400'} shrink-0`} />
            )}
            <span className={`text-sm font-black truncate ${verificationColor}`}>{verificationStatus}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200/50 dark:border-gray-700/50 col-span-2 sm:col-span-1">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Last Verified</span>
          <div className="mt-1 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">
              {formatLastVerified(lastSyncTime)}
            </span>
          </div>
        </div>
      </div>

      {/* Step 62: When streak is at risk, explain truth rather than declaring defeat */}
      {(atRiskCount > 0 || (overallStreak?.current > 0 && !isProtectedToday)) && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-amber-800 dark:text-amber-300">
              Your platform activity has not yet been verified today.
            </p>
            <p className="text-amber-700 dark:text-amber-400/90 leading-relaxed">
              If you have already completed external activities (e.g. Duolingo lesson, GitHub commit, LeetCode problem), Alumnex scans periodically and performs a final pre-midnight verification before your deadline to keep your streak intact.
            </p>
          </div>
        </div>
      )}

      {/* Progressive Disclosure: How Streaks Work Accordion */}
      <div className="rounded-xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/40 dark:bg-indigo-950/20 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowExplainer(!showExplainer)}
          className="w-full p-3 flex items-center justify-between text-xs font-bold text-indigo-900 dark:text-indigo-300 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-indigo-500" />
            <span>How streaks work in Alumnex</span>
          </div>
          <ChevronRight className={`w-4 h-4 text-indigo-500 transition-transform ${showExplainer ? 'rotate-90' : ''}`} />
        </button>
        {showExplainer && (
          <div className="px-3.5 pb-3.5 pt-1 border-t border-indigo-100 dark:border-indigo-900/30 text-[11px] text-gray-600 dark:text-gray-400 space-y-1">
            <p>• An overall active day is recorded whenever at least one verified activity or goal is completed.</p>
            <p>• Dates are strictly computed in your local timezone ({timezone}) without relying on UTC shifts.</p>
            <p>• Scheduled goals only require completion on their active days (weekdays or custom days); unscheduled days do not break your streak.</p>
            <p>• Pre-midnight streak protection automatically double-checks your external platform activity before your day ends.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StreakProtectionCard;
