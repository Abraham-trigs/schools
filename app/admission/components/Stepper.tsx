// app/admissions/components/Stepper.tsx

import React from "react";

interface StepperProps {
  currentStep: number;
  steps: { name: string }[];
  progress: number;
}

const Stepper: React.FC<StepperProps> = ({ currentStep, steps, progress }) => {
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-semibold text-gray-700">
          Step {currentStep + 1} of {steps.length}: {steps[currentStep].name}
        </h2>
        <span className="text-sm font-medium text-blue-600">
          {progress}% Complete
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
};

export default Stepper;
