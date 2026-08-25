import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import DefaultForum from './DefaultForum';
import StitchForum from './stitch/StitchForum';

const Forum = () => {
  const { theme } = useTheme();

  if (theme === 'stitch') {
    return <StitchForum />;
  }

  return <DefaultForum />;
};

export default Forum;
