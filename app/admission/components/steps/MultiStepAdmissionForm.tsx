// app/admission/components/MultiStepAdmissionForm.tsx
"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import StepActionButton from "../StepActionButton.tsx";
import { useAdmissionStore } from "@/app/store/admissionStore.ts";

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
  const router = useRouter();
  const { completeStep } = useAdmissionStore();

  const StepComponent = useMemo(() => steps[currentStep], [currentStep]);

  // Calculate progress bar
  const stepProgress = ((currentStep + 1) / maxSteps) * 100;

  const advanceStep = () => {
    if (currentStep < maxSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else if (onComplete) {
      onComplete();
    }
  };

  const goBackStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const saveAndContinueLater = async () => {
    try {
      await completeStep(currentStep); // persist current step
      router.push("/dashboard"); // navigate away
    } catch (err) {
      console.error("Save & Continue Later failed:", err);
    }
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

      {/* Navigation Buttons */}
      {/* Navigation Buttons */}
      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        {currentStep > 0 && (
          <StepActionButton
            currentStep={currentStep}
            label="Back"
            colorClass="bg-gray-400 hover:bg-gray-500"
            onStepComplete={goBackStep}
          />
        )}

        <div className="flex gap-3 ml-auto">
          <StepActionButton
            currentStep={currentStep}
            label={currentStep === maxSteps - 1 ? "Submit" : "Next"}
            colorClass="bg-green-500 hover:bg-green-600"
            onStepComplete={advanceStep}
          />

          {/* Save & Continue Later button (hidden on step 1) */}
          {currentStep !== 0 && (
            <StepActionButton
              currentStep={currentStep}
              label="Save & Continue Later"
              colorClass="bg-blue-500 hover:bg-blue-600"
              onStepComplete={saveAndContinueLater}
            />
          )}
        </div>
      </div>
    </div>
  );
}
