// app/admission/components/Step0UserInfo.tsx
// Purpose: Step 0 of the admission form — captures basic user info with fully normalized inputs.

"use client";

import React from "react";
import { useAdmissionStore } from "@/app/store/admissionStore.ts";
import LabeledInput from "./LabeledInput.tsx";

export default function StepUserInfo() {
  const { formData, setField } = useAdmissionStore();

  return (
    <div className="space-y-4">
      <LabeledInput
        label="Surname"
        value={formData.surname || ""}
        onChangeValue={(v) => setField("surname", v)}
        placeholder="Enter surname"
      />
      <LabeledInput
        label="First Name"
        value={formData.firstName || ""}
        onChangeValue={(v) => setField("firstName", v)}
        placeholder="Enter first name"
      />
      <LabeledInput
        label="Other Names"
        value={formData.otherNames || ""}
        onChangeValue={(v) => setField("otherNames", v)}
        placeholder="Enter other names"
      />
      <LabeledInput
        label="Email"
        value={formData.email || ""}
        onChangeValue={(v) => setField("email", v)}
        placeholder="Enter email"
        type="email"
      />
      <LabeledInput
        label="Password"
        value={formData.password || ""}
        onChangeValue={(v) => setField("password", v)}
        placeholder="Enter password"
        type="password"
      />
    </div>
  );
}

/*
Design reasoning:
- Uses the updated LabeledInput to normalize onChange events.
- Prevents [object Object] being set in the store.
- Each input updates zustand state directly and maintains progress tracking.

Structure:
- Single functional component for Step 0.
- Five input fields: surname, firstName, otherNames, email, password.
- Uses useAdmissionStore for state management.

Implementation guidance:
- Ensure all other step components follow the same onChangeValue pattern.
- Drop-in replacement for the previous Step0UserInfo.tsx.
- Maintains TypeScript type safety.

Scalability insight:
- Pattern can be reused across all multi-step forms.
- Centralizing input normalization reduces bugs and ensures consistent UX.
*/
