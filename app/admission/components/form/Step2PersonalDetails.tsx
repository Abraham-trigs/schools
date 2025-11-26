// app/admission/steps/Step2PersonalDetails.tsx
"use client";

import React from "react";
import { useAdmissionStore } from "@/app/store/admissionStore.ts";

export default function Step2PersonalDetails() {
  const { formData, setField } = useAdmissionStore();

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-[var(--ford-primary)]">
        Step 2: Personal Details
      </h2>

      <input
        className="w-full p-2 rounded bg-[var(--background)] text-[var(--ford-primary)]"
        placeholder="Surname"
        value={formData.surname || ""}
        onChange={(e) => setField("surname", e.target.value)}
      />
      <input
        className="w-full p-2 rounded bg-[var(--background)] text-[var(--ford-primary)]"
        placeholder="First Name"
        value={formData.firstName || ""}
        onChange={(e) => setField("firstName", e.target.value)}
      />
      <input
        className="w-full p-2 rounded bg-[var(--background)] text-[var(--ford-primary)]"
        placeholder="Other Names"
        value={formData.otherNames || ""}
        onChange={(e) => setField("otherNames", e.target.value)}
      />
      <input
        type="date"
        className="w-full p-2 rounded bg-[var(--background)] text-[var(--ford-primary)]"
        placeholder="Date of Birth"
        value={formData.dateOfBirth || ""}
        onChange={(e) => setField("dateOfBirth", e.target.value)}
      />
      <input
        className="w-full p-2 rounded bg-[var(--background)] text-[var(--ford-primary)]"
        placeholder="Nationality"
        value={formData.nationality || ""}
        onChange={(e) => setField("nationality", e.target.value)}
      />
      <select
        className="w-full p-2 rounded bg-[var(--background)] text-[var(--ford-primary)]"
        value={formData.sex || ""}
        onChange={(e) => setField("sex", e.target.value)}
      >
        <option value="">Select Sex</option>
        <option value="Male">Male</option>
        <option value="Female">Female</option>
      </select>
    </div>
  );
}
