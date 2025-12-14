// app/admission/components/StepMedicalInfo.tsx
// Purpose: Step for medical information in the admission form, including medical summary, blood type, and special disabilities.

"use client";

import React from "react";
import { useAdmissionStore } from "@/app/store/admissionStore.ts";
import LabeledInput from "./LabeledInput.tsx";

export default function StepMedicalInfo() {
  const { formData, setField } = useAdmissionStore();

  return (
    <div className="space-y-4">
      <LabeledInput
        label="Medical Summary"
        value={formData.medicalSummary || ""}
        onChangeValue={(v) => setField("medicalSummary", v)}
        placeholder="Provide general medical summary"
      />
      <LabeledInput
        label="Blood Type"
        value={formData.bloodType || ""}
        onChangeValue={(v) => setField("bloodType", v)}
      />
      <LabeledInput
        label="Special Disability"
        value={formData.specialDisability || ""}
        onChangeValue={(v) => setField("specialDisability", v)}
      />
    </div>
  );
}

/*
Design reasoning:
- Follows the updated approach for normalized input handling via `onChangeValue`.
- Fields capture key medical details like summary, blood type, and special disabilities.

Structure:
- Single functional component for Step Medical Info.
- Three input fields: medicalSummary, bloodType, specialDisability.
- Uses useAdmissionStore to update state.

Implementation guidance:
- Ensure that the `onChangeValue` method is used across all step components.
- No change to state management logic, simply ensures proper value updates.

Scalability insight:
- This pattern scales seamlessly to any future step forms.
- Centralizing the normalized handling improves maintainability and reduces form errors.
*/
