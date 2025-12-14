// app/admission/components/Step2LanguagesReligion.tsx
// Purpose: Step 2 of the admission form — captures languages, religion, and region info with normalized inputs.

"use client";

import React from "react";
import { useAdmissionStore } from "@/app/store/admissionStore.ts";
import LabeledInput from "./LabeledInput.tsx";

export default function StepLanguagesReligion() {
  const { formData, setField } = useAdmissionStore();

  return (
    <div className="space-y-4">
      <LabeledInput
        label="Languages"
        value={formData.languages?.join(", ") || ""}
        onChangeValue={(v) =>
          setField(
            "languages",
            v
              .split(",")
              .map((s) => s.trim())
              .filter((s) => s.length > 0)
          )
        }
        placeholder="Enter languages separated by comma"
      />
      <LabeledInput
        label="Mother's Tongue"
        value={formData.mothersTongue || ""}
        onChangeValue={(v) => setField("mothersTongue", v)}
        placeholder="Enter mother's tongue"
      />
      <LabeledInput
        label="Religion"
        value={formData.religion || ""}
        onChangeValue={(v) => setField("religion", v)}
        placeholder="Enter religion"
      />
      <LabeledInput
        label="Denomination"
        value={formData.denomination || ""}
        onChangeValue={(v) => setField("denomination", v)}
        placeholder="Enter denomination"
      />
      <LabeledInput
        label="Hometown"
        value={formData.hometown || ""}
        onChangeValue={(v) => setField("hometown", v)}
        placeholder="Enter hometown"
      />
      <LabeledInput
        label="Region"
        value={formData.region || ""}
        onChangeValue={(v) => setField("region", v)}
        placeholder="Enter region"
      />
    </div>
  );
}

/*
Design reasoning:
- Uses onChangeValue to normalize input events and prevent [object Object] bugs.
- Languages are handled as a CSV string input, stored as an array in the store.
- All other text inputs are directly mapped to store fields.

Structure:
- Single functional component for Step 2.
- Six input fields: languages, mothersTongue, religion, denomination, hometown, region.
- Uses useAdmissionStore for state updates.

Implementation guidance:
- Use the same pattern for other multi-step components.
- Trims and filters empty strings from languages to maintain clean array data.
- Drop-in replacement for previous StepLanguagesReligion.tsx.

Scalability insight:
- CSV-to-array handling can be abstracted into a small helper if used in multiple steps.
- Ensures all inputs consistently update store with normalized, predictable data.
*/
