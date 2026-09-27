import React from 'react';
import { ExternalLink, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck, Flame } from 'lucide-react';
import PlatformIcon from '../PlatformIcon';

const PlatformActivityCard = ({ platform = {}, onRefresh, isRefreshing = false }) => {
  const isConnected = platform?.connected && (platform?.status === 'connected' || platform?.status === undefined);
  const hasActivityToday = !!platform?.activityToday;
  const platformKey = platform?.platform || platform?.id || '';
  const platformName = platform?.info?.name || platform?.name || platformKey;

  return (
    <div className={`glass-card rounded-2xl p-5 border transition-all min-w-0 ${
      hasActivityToday
        ? 'border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10'
        : isConnected
        ? 'border-gray-200/50 dark:border-gray-800'
        : 'border-dashed border-gray-300 dark:border-gray-700 opacity-70'
    }`}>
      <div className="flex items-start justify-between gap-3 min-w-0">
        {/* Platform Info */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
            <PlatformIcon platform={platformKey} className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <h5 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                {platformName}
              </h5>
              {platform?.connectionType === 'api-verified' && (
                <ShieldCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" title="Verified" />
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {platform?.username ? `@${platform.username}` : 'Not connected'}
            </p>
          </div>
        </div>

        {/* Sync Button */}
        {isConnected && onRefresh && (
          <button
            onClick={() => onRefresh(platformKey)}
            disabled={isRefreshing}
            title="Refresh Platform Data"
            className="p-2 rounded-xl text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-500' : ''}`} />
          </button>
        )}
      </div>

      {/* Metrics Row */}
      {isConnected ? (
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
          <div>
            <span className="text-gray-400 font-medium">Today's State</span>
            <div className="mt-0.5 font-bold">
              {hasActivityToday ? (
                <span className="text-emerald-500 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                </span>
              ) : (
                <span className="text-gray-400">No activity yet</span>
              )}
            </div>
          </div>

          {platform.currentStreak !== null && platform.currentStreak !== undefined && (
            <div className="text-right">
              <span className="text-gray-400 font-medium">Platform Streak</span>
              <div className="mt-0.5 font-bold text-gray-900 dark:text-white flex items-center gap-1 justify-end">
                <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>{platform.currentStreak} days</span>
              </div>
            </div>
          )}

          {platform.profileUrl && (
            <div>
              <a
                href={platform.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
              >
                <span>Profile</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400">
          Connect your account in DevPulse or Profile to enable automated tracking.
        </div>
      )}
    </div>
  );
};

export default PlatformActivityCard;
