import React from 'react';

interface Step {
  title: string;
  description: string;
}

interface StepProgressProps {
  steps: Step[];
  currentStep: number;
}

export default function StepProgress({ steps, currentStep }: StepProgressProps) {
  return (
    <div className="py-4">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.title} className="relative flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                index + 1 === currentStep
                  ? 'bg-blue-500 text-white'
                  : index + 1 < currentStep
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {index + 1 < currentStep ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                index + 1
              )}
            </div>
            <div className="text-center mt-2">
              <div className="text-sm font-medium">{step.title}</div>
              <div className="text-xs text-gray-500">{step.description}</div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`absolute top-4 left-full w-full h-0.5 -ml-4 ${
                  index + 1 < currentStep ? 'bg-green-500' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 