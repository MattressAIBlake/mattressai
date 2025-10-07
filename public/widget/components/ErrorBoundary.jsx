import React from 'react';

/**
 * Error Boundary Component
 * Catches and displays errors gracefully with retry option
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Widget error:', error, errorInfo);
    
    // Send error to tracking service if available
    if (window.MattressAI && window.MattressAI.trackError) {
      window.MattressAI.trackError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary" role="alert" aria-live="assertive">
          <div className="error-boundary__content">
            <svg 
              className="error-boundary__icon" 
              viewBox="0 0 24 24" 
              aria-hidden="true"
            >
              <path 
                fill="currentColor" 
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
              />
            </svg>
            
            <h2 className="error-boundary__title">
              {this.props.title || 'Oops! Something went wrong'}
            </h2>
            
            <p className="error-boundary__message">
              {this.props.message || 'We encountered an unexpected error. Please try again.'}
            </p>
            
            {this.props.showDetails && this.state.error && (
              <details className="error-boundary__details">
                <summary>Error details</summary>
                <pre className="error-boundary__error-text">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            
            <div className="error-boundary__actions">
              <button
                className="error-boundary__button error-boundary__button--primary"
                onClick={this.handleRetry}
                aria-label="Retry"
              >
                Try Again
              </button>
              
              {this.props.onClose && (
                <button
                  className="error-boundary__button error-boundary__button--secondary"
                  onClick={this.props.onClose}
                  aria-label="Close"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Inline styles for Error Boundary
 */
const errorBoundaryStyles = `
.error-boundary {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  min-height: 300px;
  background: #fff;
}

.error-boundary__content {
  text-align: center;
  max-width: 400px;
}

.error-boundary__icon {
  width: 48px;
  height: 48px;
  color: #d93f3f;
  margin: 0 auto 16px;
}

.error-boundary__title {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 8px 0;
}

.error-boundary__message {
  font-size: 14px;
  color: #666;
  margin: 0 0 24px 0;
  line-height: 1.5;
}

.error-boundary__details {
  margin: 16px 0;
  text-align: left;
}

.error-boundary__details summary {
  cursor: pointer;
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}

.error-boundary__error-text {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  overflow-x: auto;
  max-height: 150px;
  overflow-y: auto;
}

.error-boundary__actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.error-boundary__button {
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.error-boundary__button--primary {
  background: #2c5f2d;
  color: white;
}

.error-boundary__button--primary:hover {
  background: #234d24;
  transform: translateY(-1px);
}

.error-boundary__button--secondary {
  background: transparent;
  color: #2c5f2d;
  border: 1px solid #2c5f2d;
}

.error-boundary__button--secondary:hover {
  background: #f0f0f0;
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style');
  styleEl.textContent = errorBoundaryStyles;
  document.head.appendChild(styleEl);
}


