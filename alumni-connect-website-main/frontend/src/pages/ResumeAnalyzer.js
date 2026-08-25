import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import DefaultResumeAnalyzer from './DefaultResumeAnalyzer';
import StitchAICareerMentor from './stitch/StitchAICareerMentor';

const ResumeAnalyzer = () => {
  const { theme } = useTheme();

  if (theme === 'stitch') {
    return <StitchAICareerMentor />;
  }

  return <DefaultResumeAnalyzer />;
};

export default ResumeAnalyzer;
