import React from 'react';

const CARD_VARIANTS = {
  standard: 'glass-card rounded-2xl border border-gray-200/70 dark:border-gray-800/80 shadow-sm',
  compact: 'glass-card rounded-xl border border-gray-200/60 dark:border-gray-800/70 shadow-xs p-3.5 sm:p-4',
  feature: 'glass-card rounded-2xl border border-primary-500/30 dark:border-primary-500/20 shadow-md ring-1 ring-primary-500/10',
  data: 'glass-card rounded-2xl border border-gray-200/70 dark:border-gray-800/80 shadow-sm overflow-hidden',
  action: 'glass-card rounded-2xl border border-gray-200/70 dark:border-gray-800/80 shadow-sm hover:border-primary-500/40 hover:shadow-md transition-all duration-200 cursor-pointer',
  flat: 'bg-white/60 dark:bg-gray-900/60 rounded-xl border border-gray-200/50 dark:border-gray-800/50',
};

export const Card = React.forwardRef(({ 
  children, 
  variant = 'standard', 
  className = '', 
  ...props 
}, ref) => {
  const variantClass = CARD_VARIANTS[variant] || CARD_VARIANTS.standard;
  return (
    <div 
      ref={ref}
      className={`${variantClass} transition-all duration-200 ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

export const CardHeader = React.forwardRef(({ 
  children, 
  compact = false, 
  className = '', 
  ...props 
}, ref) => (
  <div 
    ref={ref} 
    className={`${compact ? 'p-3.5 sm:p-4' : 'p-4 sm:p-5'} border-b border-gray-200/50 dark:border-gray-800/60 flex items-center justify-between gap-3 ${className}`} 
    {...props}
  >
    {children}
  </div>
));
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef(({ 
  children, 
  className = '', 
  ...props 
}, ref) => (
  <h3 
    ref={ref} 
    className={`text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 ${className}`} 
    {...props}
  >
    {children}
  </h3>
));
CardTitle.displayName = 'CardTitle';

export const CardBody = React.forwardRef(({ 
  children, 
  compact = false, 
  className = '', 
  ...props 
}, ref) => (
  <div 
    ref={ref} 
    className={`${compact ? 'p-3.5 sm:p-4' : 'p-4 sm:p-5'} ${className}`} 
    {...props}
  >
    {children}
  </div>
));
CardBody.displayName = 'CardBody';

export const CardFooter = React.forwardRef(({ 
  children, 
  compact = false, 
  className = '', 
  ...props 
}, ref) => (
  <div 
    ref={ref} 
    className={`${compact ? 'p-3 sm:p-4' : 'p-4 sm:p-5'} border-t border-gray-200/50 dark:border-gray-800/60 bg-gray-50/40 dark:bg-gray-900/40 ${className}`} 
    {...props}
  >
    {children}
  </div>
));
CardFooter.displayName = 'CardFooter';

// Convenience variant wrappers
export const CompactCard = (props) => <Card variant="compact" {...props} />;
export const StandardCard = (props) => <Card variant="standard" {...props} />;
export const FeatureCard = (props) => <Card variant="feature" {...props} />;
export const DataCard = (props) => <Card variant="data" {...props} />;
export const ActionCard = (props) => <Card variant="action" {...props} />;

export default Card;
