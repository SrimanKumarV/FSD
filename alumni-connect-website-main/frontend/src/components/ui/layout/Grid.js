import React from 'react';
import { motion } from 'framer-motion';

const Grid = ({ children, columns = 3, gap = 6, className = '', animate = false, ...props }) => {
  const gridClasses = `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns} gap-${gap} ${className}`;

  if (animate) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
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
