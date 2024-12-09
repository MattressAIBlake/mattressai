import React from 'react';
import { Check } from 'lucide-react';

interface Step {
  label: string;
  description?: string;
}

interface MultiStepFormProps {
  steps: Step[];
  currentStep: number;
  children: React.ReactNode;
}

const MultiStepForm: React.FC<MultiStepFormProps> = ({
  steps,
  currentStep,
  children,
}) => {
  return (
    <div className="space-y-8">
      <div className="relative">
        <div className="absolute left-0 top-1/2 w-full h-0.5 bg-gray-200 -translate-y-1/2" />
        <div className="relative z-10 flex justify-between">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;

            return (
              <div key={index} className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isCurrent
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <div className="mt-2 text-center">
                  <div className="text-sm font-medium text-gray-900">
                    {step.label}
                  </div>
                  {step.description && (
                    <div className="text-xs text-gray-500">
                      {step.description}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>{children}</div>
    </div>
  );
};

export default MultiStepForm;