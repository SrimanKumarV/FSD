import React from 'react';

export const Card = React.forwardRef(({ children, className = '', ...props }, ref) => {
  return (
    <div 
      ref={ref}
      className={`glass-card rounded-2xl overflow-hidden bg-white/70 dark:bg-gray-900/70 border border-gray-200/50 dark:border-gray-700/50 shadow-sm ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

export const CardHeader = React.forwardRef(({ children, className = '', ...props }, ref) => (
  <div ref={ref} className={`p-6 border-b border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between ${className}`} {...props}>
    {children}
  </div>
));
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef(({ children, className = '', ...props }, ref) => (
  <h3 ref={ref} className={`text-xl font-bold text-gray-900 dark:text-white flex items-center ${className}`} {...props}>
    {children}
  </h3>
));
CardTitle.displayName = 'CardTitle';

export const CardBody = React.forwardRef(({ children, className = '', ...props }, ref) => (
  <div ref={ref} className={`p-6 ${className}`} {...props}>
    {children}
  </div>
));
CardBody.displayName = 'CardBody';

export const CardFooter = React.forwardRef(({ children, className = '', ...props }, ref) => (
  <div ref={ref} className={`p-6 border-t border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50 ${className}`} {...props}>
    {children}
  </div>
));
CardFooter.displayName = 'CardFooter';

export default Card;
