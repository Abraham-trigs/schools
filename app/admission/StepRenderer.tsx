// app/admissions/StepRenderer.tsx
"use client";

import React, { useState } from "react";
import { useAdmissionStore } from "../store/admissionStore.ts";
import Step1UserStudent from "./steps/Step1UserStudent";
import Step2PersonalLinguistic from "./steps/Step2PersonalLinguistic";
import Step3WardDetails from "./steps/Step3WardDetails";
import Step4ContactEmergency from "./steps/Step4ContactEmergency";
import Step5MedicalInfo from "./steps/Step5MedicalInfo";
import Step6SchoolsFamily from "./steps/Step6SchoolsFamily";
import Step7FeesDeclaration from "./steps/Step7FeesDeclaration";
import Stepper from "./components/Stepper";
import { useRouter } from "next/navigation";

const steps = [
  { name: "Student Info", component: Step1UserStudent },
  { name: "Personal Details", component: Step2PersonalLinguistic },
  { name: "Ward Details", component: Step3WardDetails },
  { name: "Contact Info", component: Step4ContactEmergency },
  { name: "Medical Info", component: Step5MedicalInfo },
  { name: "Previous Education", component: Step6SchoolsFamily },
  { name: "Declaration", component: Step7FeesDeclaration },
];

export default function StepRenderer() {
  const [currentStep, setCurrentStep] = useState(0); // 0-indexed
  const router = useRouter();
  const loading = useAdmissionStore((state) => state.loading);
  const userCreated = useAdmissionStore((state) => state.userCreated);
  const completeStep = useAdmissionStore((state) => state.completeStep);
  const errors = useAdmissionStore((state) => state.errors);
  const CurrentStepComponent = steps[currentStep].component;

  const handleNext = async () => {
    // API step numbers are 1-indexed (1 to 7)
    const success = await completeStep(currentStep + 1);
    if (success && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      // Optional: scroll to top for new step
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmitFinal = async () => {
    const success = await completeStep(steps.length); // Final step
    if (success) {
      alert("Application Submitted Successfully!");
      router.push("/dashboard"); // Redirect on completion
    }
  };

  const progress = useAdmissionStore((s) => s.formData.progress);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Student Admission Form
      </h1>

      <Stepper currentStep={currentStep} steps={steps} progress={progress} />

      {errors.completeStep && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline ml-2">
            {errors.completeStep.join(", ")}
          </span>
        </div>
      )}

      <div className="mt-8 bg-white shadow-lg rounded-lg p-6">
        <CurrentStepComponent />
      </div>

      <div className="mt-8 flex justify-between">
        <button
          onClick={handleBack}
          disabled={currentStep === 0 || loading}
          className="px-6 py-2 border border-gray-300 rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          Back
        </button>

        {currentStep < steps.length - 1 ? (
          <button
            onClick={handleNext}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save and Continue"}
          </button>
        ) : (
          <button
            onClick={handleSubmitFinal}
            disabled={loading}
            className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Application"}
          </button>
        )}
      </div>

      {/* Note for Step 1 Requirement: */}
      {!userCreated && currentStep > 0 && (
        <p className="text-yellow-600 mt-4 italic">
          Note: You must successfully complete Step 1 to create an Application
          ID before proceeding to subsequent steps that require saving data to
          the backend.
        </p>
      )}
    </div>
  );
}
