import React from 'react';
import { Theme } from '../../styles/theme';
import './LoadingIndicator.css';

interface LoadingIndicatorProps {
  theme: Theme;
  text?: string;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  text = 'AI is thinking...',
}) => {
  return (
    <div className="loading-container">
      <div className="loading-dot" />
      <div className="loading-dot" />
      <div className="loading-dot" />
      <span className="loading-text">{text}</span>
    </div>
  );
}; 