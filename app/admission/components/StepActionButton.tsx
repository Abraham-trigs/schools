// app/admission/components/StepActionButton.tsx
"use client";

import React, { useState } from "react";
import { useAdmissionStore } from "@/app/store/admissionStore.ts";

interface StepActionButtonProps {
  currentStep: number;
  label: string;
  onStepComplete?: () => void; // callback after step completion
  colorClass?: string; // e.g., "bg-green-500 hover:bg-green-600"
  sizeClass?: string; // e.g., "px-6 py-3 text-lg"
  className?: string; // extra tailwind classes
}

export default function StepActionButton({
  currentStep,
  label,
  onStepComplete,
  colorClass = "bg-gray-400 hover:bg-gray-500",
  sizeClass = "px-4 py-2",
  className = "",
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
      className={`${colorClass} text-white ${sizeClass} rounded transition disabled:opacity-50 ${className}`}
    >
      {label}
    </button>
  );
}
