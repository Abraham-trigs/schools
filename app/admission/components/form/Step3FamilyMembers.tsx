// app/admission/steps/Step3Family.tsx
"use client";

import React from "react";
import { useAdmissionStore, FamilyMember } from "@/app/store/admissionStore.ts";

export default function Step3Family() {
  const { formData, setField, addFamilyMember, removeFamilyMember } =
    useAdmissionStore();

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-[var(--ford-primary)]">
        Family Members
      </h2>

      {formData.familyMembers?.map((f: FamilyMember, idx: number) => (
        <div key={idx} className="bg-[var(--background)] p-2 rounded space-y-2">
          <input
            className="w-full p-2 rounded"
            placeholder="Relation"
            value={f.relation || ""}
            onChange={(e) =>
              setField(`familyMembers.${idx}.relation`, e.target.value)
            }
          />
          <input
            className="w-full p-2 rounded"
            placeholder="Name"
            value={f.name || ""}
            onChange={(e) =>
              setField(`familyMembers.${idx}.name`, e.target.value)
            }
          />
          <input
            className="w-full p-2 rounded"
            placeholder="Postal Address"
            value={f.postalAddress || ""}
            onChange={(e) =>
              setField(`familyMembers.${idx}.postalAddress`, e.target.value)
            }
          />
          <input
            className="w-full p-2 rounded"
            placeholder="Residential Address"
            value={f.residentialAddress || ""}
            onChange={(e) =>
              setField(
                `familyMembers.${idx}.residentialAddress`,
                e.target.value
              )
            }
          />
          <button
            className="text-[var(--ford-secondary)]"
            onClick={() => removeFamilyMember(idx)}
          >
            Remove
          </button>
        </div>
      ))}

      <button
        className="px-3 py-1 bg-[var(--ford-primary)] rounded"
        onClick={() =>
          addFamilyMember({
            relation: "",
            name: "",
            postalAddress: "",
            residentialAddress: "",
          })
        }
      >
        Add Family Member
      </button>
    </div>
  );
}
