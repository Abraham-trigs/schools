// app/admission/components/StepPreviousFamily.tsx
// Purpose: Step for adding previous schools and family members in the admission form, handling dynamic additions and removals.

"use client";

import React, { useState } from "react";
import {
  useAdmissionStore,
  PreviousSchool,
  FamilyMember,
} from "@/app/store/admissionStore.ts";
import LabeledInput from "./LabeledInput.tsx";

export default function StepPreviousFamily() {
  const {
    formData,
    addPreviousSchool,
    removePreviousSchool,
    addFamilyMember,
    removeFamilyMember,
  } = useAdmissionStore();

  const [school, setSchool] = useState<Partial<PreviousSchool>>({});
  const [member, setMember] = useState<Partial<FamilyMember>>({});

  return (
    <div className="space-y-6">
      {/* Previous Schools */}
      <div className="space-y-2">
        <h3 className="font-semibold">Previous Schools</h3>
        {formData.previousSchools?.map((s, idx) => (
          <div key={idx} className="flex justify-between items-center">
            <span>
              {s.name} ({s.startDate?.toString()} - {s.endDate?.toString()})
            </span>
            <button
              type="button"
              onClick={() => removePreviousSchool(idx)}
              className="text-red-500"
            >
              Remove
            </button>
          </div>
        ))}

        <LabeledInput
          label="School Name"
          value={school.name || ""}
          onChangeValue={(v) => setSchool({ ...school, name: v })}
        />
        <LabeledInput
          label="Location"
          value={school.location || ""}
          onChangeValue={(v) => setSchool({ ...school, location: v })}
        />
        <LabeledInput
          label="Start Date"
          type="date"
          value={school.startDate?.toString() || ""}
          onChangeValue={(v) => setSchool({ ...school, startDate: v })}
        />
        <LabeledInput
          label="End Date"
          type="date"
          value={school.endDate?.toString() || ""}
          onChangeValue={(v) => setSchool({ ...school, endDate: v })}
        />
        <button
          type="button"
          onClick={() => {
            addPreviousSchool(school as PreviousSchool);
            setSchool({});
          }}
          className="bg-blue-500 text-white px-3 py-1 rounded"
        >
          Add School
        </button>
      </div>

      {/* Family Members */}
      <div className="space-y-2">
        <h3 className="font-semibold">Family Members</h3>
        {formData.familyMembers?.map((f, idx) => (
          <div key={idx} className="flex justify-between items-center">
            <span>
              {f.relation}: {f.name}
            </span>
            <button
              type="button"
              onClick={() => removeFamilyMember(idx)}
              className="text-red-500"
            >
              Remove
            </button>
          </div>
        ))}

        <LabeledInput
          label="Relation"
          value={member.relation || ""}
          onChangeValue={(v) => setMember({ ...member, relation: v })}
        />
        <LabeledInput
          label="Name"
          value={member.name || ""}
          onChangeValue={(v) => setMember({ ...member, name: v })}
        />
        <LabeledInput
          label="Postal Address"
          value={member.postalAddress || ""}
          onChangeValue={(v) => setMember({ ...member, postalAddress: v })}
        />
        <LabeledInput
          label="Residential Address"
          value={member.residentialAddress || ""}
          onChangeValue={(v) => setMember({ ...member, residentialAddress: v })}
        />
        <LabeledInput
          label="Phone"
          value={member.phone || ""}
          onChangeValue={(v) => setMember({ ...member, phone: v })}
        />
        <LabeledInput
          label="Email"
          value={member.email || ""}
          onChangeValue={(v) => setMember({ ...member, email: v })}
          type="email"
        />
        <LabeledInput
          label="Occupation"
          value={member.occupation || ""}
          onChangeValue={(v) => setMember({ ...member, occupation: v })}
        />
        <LabeledInput
          label="Workplace"
          value={member.workplace || ""}
          onChangeValue={(v) => setMember({ ...member, workplace: v })}
        />
        <LabeledInput
          label="Religion"
          value={member.religion || ""}
          onChangeValue={(v) => setMember({ ...member, religion: v })}
        />
        <LabeledInput
          label="Is Alive"
          value={member.isAlive ? "Yes" : "No"}
          onChangeValue={(v) =>
            setMember({ ...member, isAlive: v.toLowerCase() === "yes" })
          }
        />
        <button
          type="button"
          onClick={() => {
            addFamilyMember(member as FamilyMember);
            setMember({});
          }}
          className="bg-blue-500 text-white px-3 py-1 rounded"
        >
          Add Member
        </button>
      </div>
    </div>
  );
}

/*
Design reasoning:
- Ensures all inputs are normalized with the `onChangeValue` method to avoid issues like [object Object].
- Manages both previous schools and family members in the same form step with dynamic additions and removals.

Structure:
- Two main sections: Previous Schools and Family Members.
- Each section uses `LabeledInput` components for input fields, and buttons are provided for dynamic addition/removal.
- Uses Zustand state for managing form data and actions.

Implementation guidance:
- Drop in this updated version in place of the previous `StepPreviousFamily.tsx`.
- Be sure to test adding/removing both schools and family members to ensure proper state updates.

Scalability insight:
- This approach scales easily to additional fields or complex structures.
- The same pattern can be used for other dynamic forms with additions/removals, ensuring consistency in input handling.
*/
