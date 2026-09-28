import React from 'react';

export const Badge = React.forwardRef(({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  ...props 
}, ref) => {
  const baseStyles = 'inline-flex items-center font-medium rounded-full transition-colors whitespace-nowrap border shrink-0';
  
  const sizes = {
    xs: 'px-1.5 py-0.5 text-[11px] font-semibold leading-none',
    sm: 'px-2 py-0.5 text-xs font-semibold leading-normal',
    md: 'px-2.5 py-0.5 text-xs font-semibold',
    lg: 'px-3 py-1 text-sm font-medium'
  };

  const variants = {
    primary: 'bg-primary-50 text-primary-700 border-primary-200/80 dark:bg-primary-950/40 dark:text-primary-300 dark:border-primary-800/50',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50',
    warning: 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50',
    danger: 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50',
    neutral: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800/70 dark:text-gray-300 dark:border-gray-700/60',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200/80 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/50',
  };

  return (
    <span ref={ref} className={`${baseStyles} ${sizes[size] || sizes.md} ${variants[variant] || variants.primary} ${className}`} {...props}>
      {children}
    </span>
  );
});

Badge.displayName = 'Badge';

export const StatusBadge = Badge;

export default Badge;
