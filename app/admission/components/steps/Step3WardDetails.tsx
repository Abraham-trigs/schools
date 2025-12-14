// app/admission/components/Step3WardDetails.tsx
// Purpose: Step 3 of the admission form — captures ward living situation and siblings info with normalized inputs.

"use client";

import React from "react";
import { useAdmissionStore } from "@/app/store/admissionStore.ts";
import LabeledInput from "./LabeledInput.tsx";

export default function StepWardDetails() {
  const { formData, setField } = useAdmissionStore();

  return (
    <div className="space-y-4">
      <LabeledInput
        label="Profile Picture URL"
        value={formData.profilePicture || ""}
        onChangeValue={(v) => setField("profilePicture", v)}
        placeholder="Enter profile picture URL"
      />
      <LabeledInput
        label="Ward Lives With"
        value={formData.wardLivesWith || ""}
        onChangeValue={(v) => setField("wardLivesWith", v)}
      />
      <LabeledInput
        label="Number of Siblings"
        value={formData.numberOfSiblings?.toString() || ""}
        onChangeValue={(v) => setField("numberOfSiblings", parseInt(v) || 0)}
        type="number"
      />
      <LabeledInput
        label="Siblings Older"
        value={formData.siblingsOlder?.toString() || ""}
        onChangeValue={(v) => setField("siblingsOlder", parseInt(v) || 0)}
        type="number"
      />
      <LabeledInput
        label="Siblings Younger"
        value={formData.siblingsYounger?.toString() || ""}
        onChangeValue={(v) => setField("siblingsYounger", parseInt(v) || 0)}
        type="number"
      />
    </div>
  );
}

/*
Design reasoning:
- All inputs now use onChangeValue to normalize the value passed to the store.
- Numeric fields are converted using parseInt with fallback to 0 to prevent NaN values.
- Maintains progress tracking and store consistency.

Structure:
- Single functional component for Step 3.
- Five fields: profilePicture, wardLivesWith, numberOfSiblings, siblingsOlder, siblingsYounger.

Implementation guidance:
- Drop-in replacement for the previous StepWardDetails.tsx.
- Use the same onChangeValue pattern in all other steps.
- Keeps number inputs consistent and prevents [object Object] issues.

Scalability insight:
- Centralizing numeric normalization reduces bugs across multi-step forms.
- Easy to extend with additional fields without touching LabeledInput logic.
*/
