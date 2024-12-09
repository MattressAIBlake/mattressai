import React from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from './ui/Button';

const ErrorFallback = ({ error, resetErrorBoundary }: { 
  error: Error; 
  resetErrorBoundary: () => void;
}) => {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Something went wrong
        </h2>
        <p className="text-gray-600 mb-4 max-w-md">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <Button
          variant="secondary"
          icon={RefreshCw}
          onClick={resetErrorBoundary}
        >
          Try again
        </Button>
      </div>
    </div>
  );
};

export const ErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ReactErrorBoundary FallbackComponent={ErrorFallback}>
      {children}
    </ReactErrorBoundary>
  );
};