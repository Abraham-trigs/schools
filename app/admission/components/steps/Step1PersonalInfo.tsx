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
        onChangeValue={(v: string) =>
          setField("dateOfBirth", v ? new Date(v).toISOString() : "")
        }
      />
      <LabeledInput
        label="Nationality"
        value={formData.nationality || ""}
        onChangeValue={(v: string) => setField("nationality", v)}
        placeholder="Enter nationality"
      />
      <LabeledInput
        label="Sex"
        value={formData.sex || ""}
        onChangeValue={(v: string) => setField("sex", v)}
        placeholder="Enter sex"
      />
    </div>
  );
}

/*
Design reasoning:
- Ensures all onChangeValue callbacks send normalized string/ISO data to the store.
- Prevents [object Object] issues caused by passing event objects instead of string values.
- Maintains date consistency across forms using ISO string format.

Structure:
- Functional component StepPersonalInfo
- Uses useAdmissionStore to update state
- Three fields: dateOfBirth, nationality, sex

Implementation guidance:
- Always use onChangeValue for LabeledInput to avoid raw event objects.
- Normalize date inputs before sending to store.

Scalability insight:
- Adding more personal info fields is straightforward.
- Pattern ensures consistent state updates and avoids UX bugs in multi-step forms.
*/
