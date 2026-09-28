import React from 'react';
import { motion } from 'framer-motion';

// Explicit static class mapping to ensure Tailwind compiler generates all variants reliably
const COLUMN_CLASSES = {
  1: 'lg:grid-cols-1',
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
  5: 'lg:grid-cols-5',
  6: 'lg:grid-cols-6',
};

const MD_COLUMN_CLASSES = {
  1: 'md:grid-cols-1',
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
};

const GAP_CLASSES = {
  2: 'gap-2',
  3: 'gap-3',
  4: 'gap-4',
  5: 'gap-5',
  6: 'gap-6',
  8: 'gap-8',
};

const Grid = ({ children, columns = 3, gap = 6, className = '', animate = false, ...props }) => {
  const colClass = COLUMN_CLASSES[columns] || 'lg:grid-cols-3';
  const mdColClass = MD_COLUMN_CLASSES[Math.min(columns, 2)] || 'md:grid-cols-2';
  const gapClass = GAP_CLASSES[gap] || 'gap-6';

  const gridClasses = `grid grid-cols-1 ${mdColClass} ${colClass} ${gapClass} min-w-0 w-full ${className}`;

  if (animate) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.08 }
          }
        }}
        className={gridClasses}
        {...props}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={gridClasses} {...props}>
      {children}
    </div>
  );
};

export default Grid;
