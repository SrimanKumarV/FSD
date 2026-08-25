import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import DefaultTechHub from './DefaultTechHub';
import StitchTechHub from '../stitch/StitchTechHub';

const TechHub = () => {
  const { theme } = useTheme();

  if (theme === 'stitch') {
    return <StitchTechHub />;
  }

  return <DefaultTechHub />;
};

export default TechHub;
