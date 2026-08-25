import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import DefaultMentorship from './DefaultMentorship';
import StitchMentorship from './stitch/StitchMentorship';

const Mentorship = () => {
  const { theme } = useTheme();

  if (theme === 'stitch') {
    return <StitchMentorship />;
  }

  return <DefaultMentorship />;
};

export default Mentorship;
