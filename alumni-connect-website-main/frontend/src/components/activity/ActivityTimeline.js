import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, CheckCircle2, Zap, Clock, Code, BookOpen, Globe, TrendingUp, Target, Filter
} from 'lucide-react';
import PlatformIcon from '../PlatformIcon';

const categoryIcons = {
  coding: Code,
  learning: BookOpen,
  project: Globe,
  career: TrendingUp,
  custom: Target
};

const ActivityTimeline = ({ items, timeline, isCompact = false, compact = false, showFilters = true }) => {
  const raw = items || timeline;
  const isSmall = isCompact || compact;
  const [selectedCategory, setSelectedCategory] = useState('all');

  const recordList = useMemo(() => {
    return Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.items)
      ? raw.items
      : [];
  }, [raw]);

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'coding', label: 'Coding' },
    { id: 'learning', label: 'Learning' },
    { id: 'project', label: 'Projects' },
    { id: 'career', label: 'Career' },
  ];

  const filteredRecords = useMemo(() => {
    if (selectedCategory === 'all') return recordList;
    return recordList.filter(item => (item.category || '').toLowerCase() === selectedCategory);
  }, [recordList, selectedCategory]);

  const formatTime = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Group records by Today, Yesterday, This Week, Earlier
  const groupedRecords = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const groups = {
      'Today': [],
      'Yesterday': [],
      'This Week': [],
      'Earlier': []
    };

    filteredRecords.forEach(item => {
      const dStr = item.date || (item.createdAt ? item.createdAt.split('T')[0] : '');
      if (dStr === todayStr) {
        groups['Today'].push(item);
      } else if (dStr === yesterdayStr) {
        groups['Yesterday'].push(item);
      } else {
        const itemDate = new Date(dStr);
        const now = new Date();
        const diffDays = Math.floor((now - itemDate) / (1000 * 60 * 60 * 24));
        if (diffDays <= 7 && diffDays > 1) {
          groups['This Week'].push(item);
        } else {
          groups['Earlier'].push(item);
        }
      }
    });

    return groups;
  }, [filteredRecords]);

  if (recordList.length === 0) {
    return (
      <div className="py-10 text-center text-gray-400 dark:text-gray-500 text-sm">
        <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="font-semibold text-gray-700 dark:text-gray-300">Your activity story starts here.</p>
        <p className="text-xs mt-1 max-w-sm mx-auto">Connect a platform or complete your first goal to see your verified activity history.</p>
      </div>
    );
  }

  const renderItem = (item, idx) => {
    const CategoryIcon = categoryIcons[item.category] || Target;
    const isApiVerified = item.completionType === 'api-verified';
    const isAuto = item.completionType === 'auto-detected';

    return (
      <motion.div
        key={item.id || item._id || idx}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: idx * 0.03 }}
        className="relative group pl-6"
      >
        {/* Timeline Dot */}
        <div className={`absolute left-0 top-3.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center -translate-x-[7px] ${
          isApiVerified
            ? 'bg-emerald-500 shadow-sm shadow-emerald-500/40'
            : isAuto
            ? 'bg-indigo-500 shadow-sm shadow-indigo-500/40'
            : 'bg-blue-500'
        }`}>
          <div className="w-1 h-1 rounded-full bg-white" />
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
              {/* Trust badge */}
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
                    <span>Verified</span>
                  </>
                ) : isAuto ? (
                  <>
                    <Zap className="w-3 h-3 text-amber-500" />
                    <span>Auto Detected</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Logged</span>
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
  };

  return (
    <div className="space-y-6">
      {/* Category Filter Pills (shown in non-compact mode) */}
      {!isSmall && showFilters && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* When Compact: Just show simple flat list */}
      {isSmall ? (
        <div className="relative pl-3 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200 dark:before:bg-gray-800">
          {filteredRecords.slice(0, 5).map((item, idx) => renderItem(item, idx))}
        </div>
      ) : (
        /* Full View: Grouped by Today, Yesterday, This Week, Earlier */
        <div className="space-y-6">
          {Object.entries(groupedRecords).map(([groupTitle, groupItems]) => {
            if (groupItems.length === 0) return null;

            return (
              <div key={groupTitle} className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    {groupTitle}
                  </span>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
                  <span className="text-[11px] text-gray-400 font-medium">
                    {groupItems.length} {groupItems.length === 1 ? 'activity' : 'activities'}
                  </span>
                </div>

                <div className="relative pl-3 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200 dark:before:bg-gray-800">
                  {groupItems.map((item, idx) => renderItem(item, idx))}
                </div>
              </div>
            );
          })}

          {filteredRecords.length === 0 && (
            <div className="py-8 text-center text-gray-400 text-xs">
              No activities found for category "{selectedCategory}".
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ActivityTimeline;
