// app/admission/components/Step7FeesDeclaration.tsx
// Purpose: Step 7 of the admission form — captures fees acknowledgment, declaration, and final identifiers.

"use client";

import React from "react";
import { useAdmissionStore } from "@/app/store/admissionStore.ts";
import LabeledInput from "./LabeledInput.tsx";

export default function StepFeesDeclaration() {
  const { formData, setField } = useAdmissionStore();

  return (
    <div className="space-y-4">
      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={formData.feesAcknowledged || false}
          onChange={(e) => setField("feesAcknowledged", e.target.checked)}
        />
        <span>Fees Acknowledged</span>
      </label>

      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={formData.declarationSigned || false}
          onChange={(e) => setField("declarationSigned", e.target.checked)}
        />
        <span>Declaration Signed</span>
      </label>

      <LabeledInput
        label="Signature"
        value={formData.signature || ""}
        onChangeValue={(v) => setField("signature", v)}
        placeholder="Enter signature"
      />

      <LabeledInput
        label="Class ID"
        value={formData.classId || ""}
        onChangeValue={(v) => setField("classId", v)}
        placeholder="Enter class ID"
      />

      <LabeledInput
        label="Grade ID"
        value={formData.gradeId || ""}
        onChangeValue={(v) => setField("gradeId", v)}
        placeholder="Enter grade ID"
      />
    </div>
  );
}

/*
Design reasoning:
- Normalizes string inputs using onChangeValue to prevent [object Object] issues.
- Checkbox inputs correctly use e.target.checked for boolean state.
- Final step includes signature, classId, and gradeId for backend processing.

Structure:
- Two checkboxes for feesAcknowledged and declarationSigned.
- Three text inputs using updated LabeledInput with onChangeValue.
- State managed via useAdmissionStore.

Implementation guidance:
- Use this pattern for all boolean fields (checkboxes) and string fields (text inputs).
- Drop-in replacement for Step7FeesDeclaration.tsx.
- Preserves TypeScript safety and progress tracking.

Scalability insight:
- Reusable pattern for mixed boolean/string fields.
- Centralized LabeledInput normalization ensures consistent state handling across all steps.
*/
