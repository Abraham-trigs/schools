// app/admission/components/AdmissionButton.tsx
"use client";

import React, { useState } from "react";
import { useAdmissionStore } from "@/app/store/admissionStore.ts";

interface AdmissionButtonProps {
  currentStep: number;
  maxSteps?: number;
  onSuccess?: () => void; // callback after successful step completion
  label?: string;
}

export default function AdmissionButton({
  currentStep,
  maxSteps = 1,
  onSuccess,
  label,
}: AdmissionButtonProps) {
  const { loading, completeStep } = useAdmissionStore();
  const [clicked, setClicked] = useState(false);

  const handleClick = async () => {
    if (loading || clicked) return;
    setClicked(true);

    try {
      if (currentStep === 0) {
        // Step 0: may create or update user depending on store.userCreated
        const success = await useAdmissionStore.getState().completeStep(0);
        if (success && onSuccess) onSuccess();
      } else {
        // All other steps: just update the existing admission
        const success = await useAdmissionStore
          .getState()
          .completeStep(currentStep);
        if (success && onSuccess) onSuccess();
      }
    } catch (err) {
      console.error("Step completion failed:", err);
    } finally {
      setClicked(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading || clicked}
      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition disabled:opacity-50 ml-auto"
    >
      {label || (currentStep === maxSteps - 1 ? "Submit" : "Next")}
    </button>
  );
}
