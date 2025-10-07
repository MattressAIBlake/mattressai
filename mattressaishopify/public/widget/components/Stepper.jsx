import React from 'react';

/**
 * Progress Stepper Component
 * Shows guided question progress
 */
export const Stepper = ({ currentStep, totalSteps, stepLabels }) => {
  return (
    <div 
      className="stepper"
      role="progressbar"
      aria-valuenow={currentStep}
      aria-valuemin={1}
      aria-valuemax={totalSteps}
      aria-label={`Step ${currentStep} of ${totalSteps}`}
    >
      {/* Progress Bar */}
      <div className="stepper__progress-container">
        <div 
          className="stepper__progress-bar"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>

      {/* Step Indicators */}
      <div className="stepper__steps">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const stepNum = index + 1;
          const isActive = stepNum === currentStep;
          const isCompleted = stepNum < currentStep;

          return (
            <div
              key={stepNum}
              className={`stepper__step ${
                isActive ? 'stepper__step--active' : ''
              } ${isCompleted ? 'stepper__step--completed' : ''}`}
            >
              <div className="stepper__step-circle">
                {isCompleted ? (
                  <svg viewBox="0 0 16 16" className="stepper__check-icon" aria-hidden="true">
                    <path d="M6 11L3 8l1-1 2 2 5-5 1 1z" fill="currentColor" />
                  </svg>
                ) : (
                  <span className="stepper__step-number">{stepNum}</span>
                )}
              </div>
              {stepLabels && stepLabels[index] && (
                <div className="stepper__step-label">
                  {stepLabels[index]}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Step Text */}
      <div className="stepper__text">
        <span aria-live="polite">
          Step {currentStep} of {totalSteps}
        </span>
      </div>
    </div>
  );
};

/**
 * Quick Reply Chips Component
 */
export const QuickReplies = ({ options, onSelect }) => {
  const handleKeyDown = (e, option) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(option);
    }
  };

  return (
    <div 
      className="quick-replies"
      role="group"
      aria-label="Quick reply options"
    >
      {options.map((option, index) => (
        <button
          key={index}
          className="quick-reply"
          onClick={() => onSelect(option)}
          onKeyDown={(e) => handleKeyDown(e, option)}
          role="button"
          tabIndex={0}
          aria-label={`Quick reply: ${option.label}`}
        >
          {option.icon && (
            <span className="quick-reply__icon" aria-hidden="true">
              {option.icon}
            </span>
          )}
          <span className="quick-reply__label">{option.label}</span>
        </button>
      ))}
    </div>
  );
};

