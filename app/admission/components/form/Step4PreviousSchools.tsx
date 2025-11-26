// app/admission/steps/Step4PreviousSchools.tsx
"use client";

import React from "react";
import {
  useAdmissionStore,
  PreviousSchool,
} from "@/app/store/admissionStore.ts";

export default function Step4PreviousSchools() {
  const { formData, setField, addPreviousSchool, removePreviousSchool } =
    useAdmissionStore();

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-[var(--ford-primary)]">
        Previous Schools
      </h2>

      {formData.previousSchools?.map((s: PreviousSchool, idx: number) => (
        <div key={idx} className="bg-[var(--background)] p-2 rounded space-y-2">
          <input
            className="w-full p-2 rounded"
            placeholder="School Name"
            value={s.name || ""}
            onChange={(e) =>
              setField(`previousSchools.${idx}.name`, e.target.value)
            }
          />
          <input
            className="w-full p-2 rounded"
            placeholder="Location"
            value={s.location || ""}
            onChange={(e) =>
              setField(`previousSchools.${idx}.location`, e.target.value)
            }
          />
          <input
            type="date"
            className="w-full p-2 rounded"
            placeholder="Start Date"
            value={s.startDate || ""}
            onChange={(e) =>
              setField(`previousSchools.${idx}.startDate`, e.target.value)
            }
          />
          <input
            type="date"
            className="w-full p-2 rounded"
            placeholder="End Date"
            value={s.endDate || ""}
            onChange={(e) =>
              setField(`previousSchools.${idx}.endDate`, e.target.value)
            }
          />
          <button
            className="text-[var(--ford-secondary)]"
            onClick={() => removePreviousSchool(idx)}
          >
            Remove
          </button>
        </div>
      ))}

      <button
        className="px-3 py-1 bg-[var(--ford-primary)] rounded"
        onClick={() =>
          addPreviousSchool({
            name: "",
            location: "",
            startDate: "",
            endDate: "",
          })
        }
      >
        Add Previous School
      </button>
    </div>
  );
}
