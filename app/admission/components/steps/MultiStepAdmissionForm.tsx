// app/admission/components/MultiStepAdmissionForm.tsx
"use client";

import React, { useState, useMemo } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";

import {
  useAdmissionStore,
  admissionFormSchema,
} from "@/app/store/admissionStore.ts";
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

export default function MultiStepAdmissionForm() {
  const methods = useForm({
    resolver: zodResolver(admissionFormSchema),
    defaultValues: useAdmissionStore.getState().formData,
    mode: "onBlur",
  });

  const { handleSubmit } = methods;
  const [currentStep, setCurrentStep] = useState(0);
  const maxSteps = steps.length;

  const StepComponent = useMemo(() => steps[currentStep], [currentStep]);

  // Calculate per-step progress for progress bar
  const stepProgress = ((currentStep + 1) / maxSteps) * 100;

  const onNext = async () => {
    await handleSubmit(async () => {
      const success = await useAdmissionStore
        .getState()
        .completeStep(currentStep);
      if (success && currentStep < maxSteps - 1)
        setCurrentStep(currentStep + 1);
    })();
  };

  const onBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  return (
    <FormProvider {...methods}>
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

        {/* Step Content with AnimatePresence */}
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

        {/* Buttons */}
        <div className="flex justify-between mt-6">
          <AdmissionButton
            type="back"
            currentStep={currentStep}
            onBack={onBack}
          />
          <AdmissionButton
            type="next"
            currentStep={currentStep}
            maxSteps={maxSteps}
            label={currentStep === maxSteps - 1 ? "Submit" : "Next"}
          />
        </div>
      </div>
    </FormProvider>
  );
}
