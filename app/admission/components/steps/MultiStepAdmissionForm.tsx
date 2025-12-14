// app/admission/components/MultiStepAdmissionForm.tsx
"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAdmissionStore } from "@/app/store/admissionStore.ts";
import AdmissionButton from "../AdmissionButton.tsx";

// Step components
import StepUserInfo from "./Step0UserInfo.tsx";
import StepPersonalInfo from "./Step1PersonalInfo.tsx";
import StepLanguagesReligion from "./Step2LanguagesReligion.tsx";
import StepWardDetails from "./Step3WardDetails.tsx";
import StepContactEmergency from "./Step4ContactEmergency.tsx";
import StepMedicalInfo from "./Step5MedicalInfo.tsx";
import StepPreviousFamily from "./Step6PreviousFamily.tsx";
import StepFeesDeclaration from "./Step7FeesDeclaration.tsx";

// Steps in order
const steps = [
  StepUserInfo,
  StepPersonalInfo,
  StepLanguagesReligion,
  StepWardDetails,
  StepContactEmergency,
  StepMedicalInfo,
  StepPreviousFamily,
  StepFeesDeclaration,
];

interface MultiStepAdmissionFormProps {
  onComplete?: () => void; // called after final step
}

export default function MultiStepAdmissionForm({
  onComplete,
}: MultiStepAdmissionFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const maxSteps = steps.length;

  const StepComponent = useMemo(() => steps[currentStep], [currentStep]);

  // Calculate progress bar
  const stepProgress = ((currentStep + 1) / maxSteps) * 100;

  // Advance step after store confirms completion
  const advanceStep = () => {
    if (currentStep < maxSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else if (onComplete) {
      onComplete();
    }
  };

  const goBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      {/* Progress Bar */}
      <div className="relative w-full h-3 bg-gray-200 rounded mb-6">
        <motion.div
          className="absolute h-3 bg-green-500 rounded"
          initial={{ width: 0 }}
          animate={{ width: `${stepProgress}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* Animated Step */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          <StepComponent />
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        {currentStep > 0 && (
          <button
            type="button"
            onClick={goBack}
            className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 transition disabled:opacity-50"
          >
            Back
          </button>
        )}
        <AdmissionButton
          currentStep={currentStep}
          maxSteps={maxSteps}
          onSuccess={advanceStep}
        />
      </div>
    </div>
  );
}
