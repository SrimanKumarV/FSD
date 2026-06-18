import React from 'react';

const DefaultAvatar = ({ className = "w-10 h-10" }) => {
  return (
    <svg 
      className={`${className} text-gray-400 bg-gray-100 dark:bg-gray-800 dark:text-gray-300 rounded-full border-2 border-white dark:border-gray-700 shadow-sm transition-colors duration-200`} 
      fill="currentColor" 
      viewBox="0 0 24 24"
    >
      <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
};

export default DefaultAvatar;
