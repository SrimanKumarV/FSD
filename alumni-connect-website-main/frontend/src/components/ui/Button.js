import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = React.forwardRef(({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  isLoading = false, 
  disabled = false, 
  className = '', 
  type = 'button',
  ...props 
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed select-none min-h-[42px] sm:min-h-[38px]';
  
  const variants = {
    primary: 'bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white shadow-sm hover:shadow focus:ring-primary-500 border border-transparent',
    secondary: 'bg-gray-100 hover:bg-gray-200 active:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200/80 dark:border-gray-700/80 focus:ring-gray-400',
    outline: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 focus:ring-primary-500',
    ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800/60 text-gray-700 dark:text-gray-300 focus:ring-gray-400 border border-transparent',
    danger: 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-sm focus:ring-red-500 border border-transparent',
    success: 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm focus:ring-emerald-500 border border-transparent',
  };

  const sizes = {
    xs: 'px-2.5 py-1 text-xs rounded-lg min-h-[32px]',
    sm: 'px-3.5 py-1.5 text-xs sm:text-sm min-h-[36px]',
    md: 'px-4 sm:px-5 py-2 text-sm min-h-[42px] sm:min-h-[40px]',
    lg: 'px-6 py-2.5 text-base min-h-[48px]'
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin shrink-0" />}
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export const IconButton = React.forwardRef(({
  icon: Icon,
  children,
  label,
  size = 'md',
  variant = 'ghost',
  className = '',
  ...props
}, ref) => {
  const sizeMap = {
    sm: 'w-8 h-8 sm:w-8 sm:h-8 p-1 text-xs',
    md: 'w-10 h-10 sm:w-9 sm:h-9 p-2 text-sm',
    lg: 'w-12 h-12 sm:w-11 sm:h-11 p-2.5 text-base',
  };

  return (
    <Button
      ref={ref}
      variant={variant}
      aria-label={label}
      title={label}
      className={`touch-target rounded-xl !p-0 ${sizeMap[size] || sizeMap.md} ${className}`}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4 sm:w-4 sm:h-4 shrink-0" aria-hidden="true" />}
      {children}
    </Button>
  );
});

IconButton.displayName = 'IconButton';

export const ActionButton = Button;

export default Button;
