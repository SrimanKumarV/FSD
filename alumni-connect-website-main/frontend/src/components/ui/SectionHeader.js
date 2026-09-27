import React from 'react';

export const SectionHeader = ({
  title,
  subtitle,
  badge,
  action,
  className = '',
  size = 'default' // 'small' | 'default' | 'large'
}) => {
  const titleSizes = {
    small: 'text-lg font-bold',
    default: 'text-xl sm:text-2xl font-bold tracking-tight',
    large: 'text-2xl sm:text-3xl font-extrabold tracking-tight'
  };

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 ${className}`}>
      <div className="space-y-1">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h2 className={`${titleSizes[size] || titleSizes.default} text-gray-900 dark:text-white`}>
            {title}
          </h2>
          {badge && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 border border-primary-200/50 dark:border-primary-800/40">
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>

      {action && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  );
};

export default SectionHeader;
