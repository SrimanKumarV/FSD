import React, { useState } from 'react';
import DefaultAvatar from './DefaultAvatar';

/**
 * UserAvatar - Universal avatar component for displaying user photos throughout the portal.
 * Handles:
 *  - Valid Cloudinary URLs → shows the actual photo
 *  - 'default-avatar.png' placeholder → shows DefaultAvatar SVG
 *  - Broken/missing images (onError) → gracefully falls back to DefaultAvatar
 *  - null/undefined photo → shows DefaultAvatar
 *
 * @param {string}   src       - The photo URL from the user object
 * @param {string}   name      - The user's name (used for alt text)
 * @param {string}   className - Tailwind size classes e.g. "w-10 h-10"
 * @param {string}   imgClass  - Additional classes for the <img> element
 */
const UserAvatar = ({ src, name = 'User', className = 'w-10 h-10', imgClass = '' }) => {
  const [imgError, setImgError] = useState(false);

  const isValidPhoto = src &&
    src !== 'default-avatar.png' &&
    src !== '/default-avatar.png' &&
    src.trim() !== '' &&
    !imgError;

  if (isValidPhoto) {
    return (
      <img
        loading="lazy"
        src={src}
        alt={name}
        onError={() => setImgError(true)}
        className={`${className} rounded-full object-cover ${imgClass}`}
      />
    );
  }

  return <DefaultAvatar className={className} />;
};

export default UserAvatar;
