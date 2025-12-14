// app/admission/components/StepActionButton.tsx
"use client";

import React, { useState } from "react";
import { useAdmissionStore } from "@/app/store/admissionStore.ts";

interface StepActionButtonProps {
  currentStep: number;
  label: string;
  onStepComplete?: () => void; // callback after step completion
}

export default function StepActionButton({
  currentStep,
  label,
  onStepComplete,
}: StepActionButtonProps) {
  const { loading, completeStep } = useAdmissionStore();
  const [clicked, setClicked] = useState(false);

  const handleClick = async () => {
    if (loading || clicked) return;
    setClicked(true);

    try {
      await useAdmissionStore.getState().completeStep(currentStep);
      if (onStepComplete) onStepComplete();
    } catch (err) {
      console.error(`${label} step action failed:`, err);
    } finally {
      setClicked(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading || clicked}
      className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 transition disabled:opacity-50"
    >
      {label}
    </button>
  );
}
