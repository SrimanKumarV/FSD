import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import DefaultDashboard from './DefaultDashboard';
import StitchDashboard from './stitch/StitchDashboard';

const Dashboard = () => {
  const { theme } = useTheme();

  if (theme === 'stitch') {
    return <StitchDashboard />;
  }

  return <DefaultDashboard />;
};

export default Dashboard;
