// app/admission/steps/Step5Medical.tsx
"use client";

import React from "react";
import { useAdmissionStore } from "@/app/store/admissionStore.ts";

export default function Step5Medical() {
  const { formData, setField } = useAdmissionStore();

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-[var(--ford-primary)]">
        Medical & Special Needs
      </h2>

      <input
        className="w-full p-2 rounded bg-[var(--background)] text-[var(--ford-primary)]"
        placeholder="Medical Summary"
        value={formData.medicalSummary || ""}
        onChange={(e) => setField("medicalSummary", e.target.value)}
      />
      <input
        className="w-full p-2 rounded bg-[var(--background)] text-[var(--ford-primary)]"
        placeholder="Blood Type"
        value={formData.bloodType || ""}
        onChange={(e) => setField("bloodType", e.target.value)}
      />
      <input
        className="w-full p-2 rounded bg-[var(--background)] text-[var(--ford-primary)]"
        placeholder="Special Disability"
        value={formData.specialDisability || ""}
        onChange={(e) => setField("specialDisability", e.target.value)}
      />
    </div>
  );
}
