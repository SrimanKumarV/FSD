import React from 'react';
import { motion } from 'framer-motion';

const Skeleton = ({ className = '', circle = false }) => {
  return (
    <motion.div
      initial={{ opacity: 0.6 }}
      animate={{ opacity: 1 }}
      transition={{ 
        repeat: Infinity, 
        repeatType: 'reverse', 
        duration: 1, 
        ease: 'easeInOut' 
      }}
      className={`bg-gray-200 dark:bg-gray-800 ${circle ? 'rounded-full' : 'rounded-xl'} ${className}`}
    />
  );
};

export const SkeletonCard = ({ className = '' }) => (
  <div className={`p-4 border border-gray-100 dark:border-gray-800 rounded-2xl ${className}`}>
    <div className="flex items-center gap-4 mb-4">
      <Skeleton className="w-12 h-12" circle />
      <div className="space-y-2 flex-1">
        <Skeleton className="w-3/4 h-4" />
        <Skeleton className="w-1/2 h-3" />
      </div>
    </div>
    <div className="space-y-2">
      <Skeleton className="w-full h-3" />
      <Skeleton className="w-5/6 h-3" />
      <Skeleton className="w-4/6 h-3" />
    </div>
  </div>
);

export default Skeleton;
