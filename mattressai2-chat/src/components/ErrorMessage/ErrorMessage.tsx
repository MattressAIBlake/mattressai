import React, { useState, useEffect } from 'react';
import { Theme } from '../../styles/theme';
import { ApiError, RateLimitError, ErrorService } from '../../services/error.service';
import './ErrorMessage.css';

interface ErrorMessageProps {
  error: Error;
  theme: Theme;
  onRetry?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  onRetry
}) => {
  const [retryCountdown, setRetryCountdown] = useState<number>(0);
  const message = ErrorService.getUserFriendlyMessage(error);
  const isRetryable = error instanceof ApiError && error.isRetryable;

  useEffect(() => {
    if (error instanceof RateLimitError && error.retryAfter) {
      setRetryCountdown(Math.ceil(error.retryAfter / 1000));
      
      const interval = setInterval(() => {
        setRetryCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [error]);

  return (
    <div className="error-container">
      <div className="error-content">
        <span className="error-text">{message}</span>
        {isRetryable && onRetry && (
          <button 
            className="retry-button" 
            onClick={onRetry}
            disabled={retryCountdown > 0}
          >
            {retryCountdown > 0
              ? `Retry in ${retryCountdown}s`
              : 'Try Again'}
          </button>
        )}
      </div>
    </div>
  );
}; 