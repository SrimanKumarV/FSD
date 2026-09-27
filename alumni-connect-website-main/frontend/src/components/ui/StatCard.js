import React from 'react';
import { motion } from 'framer-motion';

const colorStyles = {
  primary: {
    iconBg: 'bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 border-primary-200/50 dark:border-primary-800/40',
    glow: 'hover:border-primary-500/30'
  },
  emerald: {
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/40',
    glow: 'hover:border-emerald-500/30'
  },
  amber: {
    iconBg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-800/40',
    glow: 'hover:border-amber-500/30'
  },
  rose: {
    iconBg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200/50 dark:border-rose-800/40',
    glow: 'hover:border-rose-500/30'
  },
  blue: {
    iconBg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-800/40',
    glow: 'hover:border-blue-500/30'
  },
  purple: {
    iconBg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-200/50 dark:border-purple-800/40',
    glow: 'hover:border-purple-500/30'
  }
};

export const StatCard = ({
  label,
  value,
  icon: Icon,
  subtitle,
  trend,
  trendDirection = 'neutral', // 'up' | 'down' | 'neutral'
  color = 'primary',
  onClick,
  className = '',
  loading = false
}) => {
  const scheme = colorStyles[color] || colorStyles.primary;

  if (loading) {
    return (
      <div className={`p-5 rounded-2xl bg-white/70 dark:bg-gray-900/70 border border-gray-200/60 dark:border-gray-800/80 shadow-sm animate-pulse flex flex-col justify-between ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded"></div>
          <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-800"></div>
        </div>
        <div className="h-8 w-16 bg-gray-200 dark:bg-gray-800 rounded mb-2"></div>
        <div className="h-3 w-32 bg-gray-200 dark:bg-gray-800 rounded"></div>
      </div>
    );
  }

  const isClickable = Boolean(onClick);

  return (
    <motion.div
      whileHover={isClickable ? { y: -2, transition: { duration: 0.2 } } : undefined}
      onClick={onClick}
      role={isClickable ? 'button' : 'region'}
      tabIndex={isClickable ? 0 : undefined}
      aria-label={`${label}: ${value}`}
      className={`relative p-5 rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-200/70 dark:border-gray-800/80 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between ${scheme.glow} ${isClickable ? 'cursor-pointer active:scale-[0.99]' : ''} ${className}`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 line-clamp-1">
          {label}
        </span>
        {Icon && (
          <div className={`p-2.5 rounded-xl border flex-shrink-0 flex items-center justify-center ${scheme.iconBg}`}>
            <Icon className="w-5 h-5" aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1 min-w-0">
        <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight truncate">
          {value}
        </div>

        {(subtitle || trend) && (
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
            {trend && (
              <span
                className={`font-semibold ${
                  trendDirection === 'up'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : trendDirection === 'down'
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {trend}
              </span>
            )}
            {subtitle && <span className="truncate">{subtitle}</span>}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StatCard;
