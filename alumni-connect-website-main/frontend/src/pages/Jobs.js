import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import DefaultJobs from './DefaultJobs';
import StitchJobs from './stitch/StitchJobs';

const Jobs = () => {
  const { theme } = useTheme();

  if (theme === 'stitch') {
    return <StitchJobs />;
  }

  return <DefaultJobs />;
};

export default Jobs;
