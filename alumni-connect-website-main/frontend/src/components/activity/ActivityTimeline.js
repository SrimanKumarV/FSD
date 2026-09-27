import React from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck, CheckCircle2, Zap, Clock, Code, BookOpen, Globe, TrendingUp, Target
} from 'lucide-react';
import PlatformIcon from '../PlatformIcon';

const categoryIcons = {
  coding: Code,
  learning: BookOpen,
  project: Globe,
  career: TrendingUp,
  custom: Target
};

const ActivityTimeline = ({ items, timeline, isCompact = false, compact = false }) => {
  const raw = items || timeline;
  const recordList = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.items)
    ? raw.items
    : [];

  if (recordList.length === 0) {
    return (
      <div className="py-6 text-center text-gray-400 dark:text-gray-500 text-sm">
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p>No recent activity records found.</p>
        <p className="text-xs mt-1">Activities will appear automatically as you work and complete goals.</p>
      </div>
    );
  }

  const formatTime = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200 dark:before:bg-gray-800">
      {recordList.map((item, idx) => {
        const CategoryIcon = categoryIcons[item.category] || Target;
        const isApiVerified = item.completionType === 'api-verified';
        const isAuto = item.completionType === 'auto-detected';

        return (
          <motion.div
            key={item.id || idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.04 }}
            className="relative group"
          >
            {/* Timeline Dot */}
            <div className={`absolute -left-[27px] top-1.5 w-4 h-4 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center ${
              isApiVerified
                ? 'bg-emerald-500'
                : isAuto
                ? 'bg-indigo-500'
                : 'bg-blue-500'
            }`}>
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
            </div>

            <div className="p-3.5 rounded-xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-200/50 dark:border-gray-700/50 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-all">
              <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                <div className="flex items-center gap-2">
                  {item.platform && item.platform !== 'custom' ? (
                    <PlatformIcon platform={item.platform} className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <CategoryIcon className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  )}
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {item.title}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Trust source badge */}
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isApiVerified
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : isAuto
                      ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                      : 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border border-gray-500/20'
                  }`}>
                    {isApiVerified ? (
                      <>
                        <ShieldCheck className="w-3 h-3" />
                        <span>API Verified</span>
                      </>
                    ) : isAuto ? (
                      <>
                        <Zap className="w-3 h-3 text-amber-500" />
                        <span>Auto Detected</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Manual</span>
                      </>
                    )}
                  </span>

                  <span className="text-xs text-gray-400 font-medium">
                    {item.date} {formatTime(item.createdAt)}
                  </span>
                </div>
              </div>

              {item.notes && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 italic pl-6">
                  "{item.notes}"
                </p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default ActivityTimeline;
