import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import DefaultNetwork from './DefaultNetwork';
import StitchNetwork from './stitch/StitchNetwork';

const Network = () => {
  const { theme } = useTheme();

  if (theme === 'stitch') {
    return <StitchNetwork />;
  }

  return <DefaultNetwork />;
};

export default Network;
