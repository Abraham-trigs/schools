// app/admission/steps/Step7Declaration.tsx
"use client";

import React from "react";
import { useAdmissionStore } from "@/app/store/admissionStore.ts";

export default function Step7Declaration() {
  const { formData, setField } = useAdmissionStore();

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-[var(--ford-primary)]">
        Declaration & Submission
      </h2>

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
    </div>
  );
}
