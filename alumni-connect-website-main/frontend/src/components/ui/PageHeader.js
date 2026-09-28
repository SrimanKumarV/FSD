import React from 'react';

/**
 * Standard Alumnex Page Header
 * Follows hierarchy:
 * PAGE TITLE (24-28px font-bold)
 * OPTIONAL SHORT CONTEXT (13-14px text-secondary)
 * OPTIONAL ACTION CONTROLS (Buttons/Filters right-aligned)
 */
export const PageHeader = ({
  title,
  subtitle,
  children,
  badge,
  className = '',
}) => {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6 ${className}`}>
      <div className="min-w-0">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight truncate">
            {title}
          </h1>
          {badge && <div className="shrink-0">{badge}</div>}
        </div>
        {subtitle && (
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 leading-normal max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>

      {children && (
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:self-center">
          {children}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
