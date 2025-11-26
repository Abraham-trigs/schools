// app/admission/steps/Step6Class.tsx
"use client";

import React, { useEffect } from "react";
import { useAdmissionStore, SchoolClass } from "@/app/store/admissionStore.ts";

export default function Step6Class() {
  const { formData, setField, availableClasses, fetchClasses } =
    useAdmissionStore();

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-[var(--ford-primary)]">
        Class & Admission
      </h2>

      <select
        className="w-full p-2 rounded bg-[var(--background)] text-[var(--ford-primary)]"
        value={formData.classId || ""}
        onChange={(e) => setField("classId", e.target.value)}
      >
        <option value="">Select Class</option>
        {availableClasses.map((c: SchoolClass) => (
          <option key={c.id} value={c.id}>
            {c.grade} - {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}
