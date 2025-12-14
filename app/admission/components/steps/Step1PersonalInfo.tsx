// app/admission/components/Step1PersonalInfo.tsx
// Purpose: Step 1 of the admission form — captures personal info with normalized inputs.

"use client";

import React from "react";
import { useAdmissionStore } from "@/app/store/admissionStore.ts";
import LabeledInput from "./LabeledInput.tsx";

export default function StepPersonalInfo() {
  const { formData, setField } = useAdmissionStore();

  return (
    <div className="space-y-4">
      <LabeledInput
        label="Date of Birth"
        type="date"
        value={
          formData.dateOfBirth
            ? new Date(formData.dateOfBirth).toISOString().substr(0, 10)
            : ""
        }
        onChangeValue={(v) => setField("dateOfBirth", v)}
      />
      <LabeledInput
        label="Nationality"
        value={formData.nationality || ""}
        onChangeValue={(v) => setField("nationality", v)}
        placeholder="Enter nationality"
      />
      <LabeledInput
        label="Sex"
        value={formData.sex || ""}
        onChangeValue={(v) => setField("sex", v)}
        placeholder="Enter sex"
      />
    </div>
  );
}

/*
Design reasoning:
- Uses LabeledInput with onChangeValue to ensure only string values are sent to the store.
- Normalizes date input to ISO format for consistent storage.
- Prevents [object Object] assignment in zustand state.

Structure:
- Functional component StepPersonalInfo
- Three fields: dateOfBirth, nationality, sex
- Uses useAdmissionStore for state updates

Implementation guidance:
- Drop-in replacement for previous Step1PersonalInfo.tsx
- Maintain ISO string formatting for date input for consistency across forms

Scalability insight:
- Pattern supports adding more personal info fields easily
- Using onChangeValue ensures consistency across all form steps
*/
