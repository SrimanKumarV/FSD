import React from 'react';

const Avatar = ({ src, alt, size = 'md', className = '', status }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    busy: 'bg-red-500',
    away: 'bg-yellow-500'
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {src ? (
        <img 
          src={src} 
          alt={alt || 'Avatar'} 
          className={`${sizeClasses[size]} rounded-full object-cover border-2 border-white dark:border-gray-800 shadow-sm`} 
        />
      ) : (
        <div className={`${sizeClasses[size]} rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 flex items-center justify-center font-bold border-2 border-white dark:border-gray-800 shadow-sm text-sm`}>
          {alt ? alt.charAt(0).toUpperCase() : '?'}
        </div>
      )}
      
      {status && (
        <span 
          className={`absolute bottom-0 right-0 block w-3 h-3 rounded-full ring-2 ring-white dark:ring-gray-800 ${statusColors[status]}`} 
        />
      )}
    </div>
  );
};

export default Avatar;
