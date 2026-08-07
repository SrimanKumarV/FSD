import React from 'react';
import { motion } from 'framer-motion';

const ScrollReveal = ({ 
  children, 
  className = '', 
  direction = 'up', // up, down, left, right, or none
  delay = 0,
  duration = 0.5,
  once = true 
}) => {
  const getInitialPosition = () => {
    switch (direction) {
      case 'up': return { y: 30, opacity: 0 };
      case 'down': return { y: -30, opacity: 0 };
      case 'left': return { x: 30, opacity: 0 };
      case 'right': return { x: -30, opacity: 0 };
      case 'none': return { opacity: 0 };
      default: return { y: 30, opacity: 0 };
    }
  };

  return (
    <motion.div
      initial={getInitialPosition()}
      whileInView={{ x: 0, y: 0, opacity: 1 }}
      viewport={{ once, margin: '-50px' }}
      transition={{ 
        duration, 
        delay, 
        ease: [0.25, 0.1, 0.25, 1.0] // smooth easing
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default ScrollReveal;
