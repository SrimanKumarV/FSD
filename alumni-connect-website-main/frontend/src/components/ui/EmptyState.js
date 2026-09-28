import React from 'react';
import { motion } from 'framer-motion';

export const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction,
  compact = false,
  className = ''
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`flex flex-col flex-1 w-full items-center justify-center text-center rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 bg-gray-50/40 dark:bg-gray-900/40 ${
        compact 
          ? 'py-8 px-4 min-h-[160px]' 
          : 'py-12 px-6 min-h-[260px]'
      } ${className}`}
      role="region"
      aria-label={title || "No data"}
    >
      {Icon && (
        <div className={`rounded-2xl bg-primary-50 dark:bg-primary-950/40 flex items-center justify-center text-primary-500 mb-3 border border-primary-100 dark:border-primary-900/30 ${
          compact ? 'w-10 h-10' : 'w-12 h-12'
        }`}>
          <Icon className={compact ? 'w-5 h-5' : 'w-6 h-6'} aria-hidden="true" />
        </div>
      )}
      <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
        {title}
      </h3>
      {description && (
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-sm mt-1 mb-4 leading-relaxed">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all mt-1"
        >
          {actionLabel}
        </button>
      )}
    </motion.div>
  );
};

export const EmptyStateCard = (props) => (
  <div className="glass-card rounded-2xl p-4 sm:p-6 border border-gray-200/60 dark:border-gray-800">
    <EmptyState compact {...props} />
  </div>
);

export default EmptyState;
