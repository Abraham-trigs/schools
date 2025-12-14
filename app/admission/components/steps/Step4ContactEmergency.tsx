// app/admission/components/Step4ContactEmergency.tsx
// Purpose: Step 4 of the admission form — captures contact and emergency information with normalized inputs.

"use client";

import React from "react";
import { useAdmissionStore } from "@/app/store/admissionStore.ts";
import LabeledInput from "./LabeledInput.tsx";

export default function StepContactEmergency() {
  const { formData, setField } = useAdmissionStore();

  return (
    <div className="space-y-4">
      <LabeledInput
        label="Postal Address"
        value={formData.postalAddress || ""}
        onChangeValue={(v) => setField("postalAddress", v)}
      />
      <LabeledInput
        label="Residential Address"
        value={formData.residentialAddress || ""}
        onChangeValue={(v) => setField("residentialAddress", v)}
      />
      <LabeledInput
        label="Ward Mobile"
        value={formData.wardMobile || ""}
        onChangeValue={(v) => setField("wardMobile", v)}
      />
      <LabeledInput
        label="Emergency Contact"
        value={formData.emergencyContact || ""}
        onChangeValue={(v) => setField("emergencyContact", v)}
      />
      <LabeledInput
        label="Emergency Medical Contact"
        value={formData.emergencyMedicalContact || ""}
        onChangeValue={(v) => setField("emergencyMedicalContact", v)}
      />
    </div>
  );
}

/*
Design reasoning:
- Uses LabeledInput with onChangeValue to normalize events to string values.
- Ensures state in zustand is updated correctly, preventing [object Object] issues.
- Centralizes emergency and contact info in a single step.

Structure:
- Functional component with five input fields mapped to store.
- Integrates with useAdmissionStore for direct state updates.

Implementation guidance:
- Drop-in replacement for the previous StepContactEmergency.tsx.
- All inputs now use onChangeValue consistently across the form.

Scalability insight:
- Standardized input handling simplifies validation, error display, and store updates for multi-step forms.
- Pattern can be applied to all remaining step components to maintain UX consistency.
*/
