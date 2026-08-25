import React from 'react';

const Badge = React.forwardRef(({ children, variant = 'primary', size = 'md', className = '', ...props }, ref) => {
  const baseStyles = 'inline-flex items-center font-medium rounded-full transition-colors whitespace-nowrap border';
  
  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm'
  };

  const variants = {
    primary: 'bg-primary-100 text-primary-800 border-primary-200 dark:bg-primary-900/30 dark:text-primary-300 dark:border-primary-800/50',
    success: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800/50',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800/50',
    danger: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800/50',
    neutral: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
  };

  return (
    <span ref={ref} className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
});

Badge.displayName = 'Badge';
export default Badge;
