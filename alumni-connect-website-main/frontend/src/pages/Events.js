import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import DefaultEvents from './DefaultEvents';
import StitchEvents from './stitch/StitchEvents';

const Events = () => {
  const { theme } = useTheme();

  if (theme === 'stitch') {
    return <StitchEvents />;
  }

  return <DefaultEvents />;
};

export default Events;
