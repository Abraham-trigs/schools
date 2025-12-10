// app/admissions/steps/Step6SchoolsFamily.tsx
"use client";

import React from "react";
import {
  useAdmissionStore,
  FamilyMember,
  PreviousSchool,
} from "../../store/admissionStore.ts";

// This step uses direct store manipulation rather than react-hook-form for arrays for simplicity here
export default function Step6SchoolsFamily() {
  const {
    formData,
    addFamilyMember,
    removeFamilyMember,
    addPreviousSchool,
    removePreviousSchool,
  } = useAdmissionStore();

  const handleAddFamilyMember = () => {
    // In a production form, you would open a modal to capture data properly
    const newMember: FamilyMember = {
      relation: prompt("Relation (e.g., Mother, Father, Guardian)") || "Other",
      name: prompt("Full Name") || "N/A",
      postalAddress: prompt("Postal Address") || "N/A",
      residentialAddress: prompt("Residential Address") || "N/A",
    };
    addFamilyMember(newMember);
  };

  const handleAddPreviousSchool = () => {
    // In a production form, you would open a modal to capture data properly
    const newSchool: PreviousSchool = {
      name: prompt("School Name") || "N/A",
      location: prompt("Location") || "N/A",
      startDate: new Date(), // Use proper date picker in real app
      endDate: new Date(),
    };
    addPreviousSchool(newSchool);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">
        Previous Education & Family Details
      </h2>

      {/* Previous Schools Section */}
      <div>
        <h3 className="text-lg font-medium mb-2">Previous Schools Attended</h3>
        <button
          type="button"
          onClick={handleAddPreviousSchool}
          className="mb-4 text-blue-600 hover:text-blue-800"
        >
          + Add Previous School
        </button>
        <ul className="list-disc pl-5">
          {formData.previousSchools?.map((school, idx) => (
            <li
              key={idx}
              className="flex justify-between items-center bg-gray-50 p-2 rounded"
            >
              {school.name} ({new Date(school.startDate).getFullYear()} -{" "}
              {new Date(school.endDate).getFullYear()})
              <button
                type="button"
                onClick={() => removePreviousSchool(idx)}
                className="text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Family Members Section */}
      <div>
        <h3 className="text-lg font-medium mb-2">Family Members / Guardians</h3>
        <button
          type="button"
          onClick={handleAddFamilyMember}
          className="mb-4 text-blue-600 hover:text-blue-800"
        >
          + Add Family Member
        </button>
        <ul className="list-disc pl-5">
          {formData.familyMembers?.map((member, idx) => (
            <li
              key={idx}
              className="flex justify-between items-center bg-gray-50 p-2 rounded"
            >
              {member.name} ({member.relation})
              <button
                type="button"
                onClick={() => removeFamilyMember(idx)}
                className="text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
