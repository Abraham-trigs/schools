// app/admission/page.tsx
// Purpose: Multi-step student admission form page with inline modals, progress bar, validation, and full Zustand integration for production-ready usage.

"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  useAdmissionStore,
  FamilyMember,
  PreviousSchool,
  SchoolClass,
} from "@/app/store/admissionStore.ts";
import {
  FamilyMemberModal,
  PreviousSchoolModal,
} from "@/app/components/admission/AdmissionForm.tsx";
import { z } from "zod";

// =====================
// Component
// =====================
export default function AdmissionPage() {
  const store = useAdmissionStore();
  const {
    formData,
    setField,
    addFamilyMember,
    removeFamilyMember,
    addPreviousSchool,
    removePreviousSchool,
    fetchClasses,
    submitForm,
    errors,
    loading,
    submitted,
    availableClasses,
  } = store;

  const [currentStep, setCurrentStep] = useState(1);
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [showSchoolModal, setShowSchoolModal] = useState(false);

  const stepCount = 7;

  const progress = ((currentStep - 1) / (stepCount - 1)) * 100;

  const nextStep = () => setCurrentStep((s) => Math.min(s + 1, stepCount));
  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 1));

  useEffect(() => {
    fetchClasses();
  }, []);

  const inputClass =
    "w-full p-2 rounded bg-[var(--background)] text-[var(--ford-primary)]";

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-[var(--ford-primary)]">
              Personal Details
            </h2>
            <input
              className={inputClass}
              placeholder="Surname"
              value={formData.surname}
              onChange={(e) => setField("surname", e.target.value)}
            />
            <input
              className={inputClass}
              placeholder="First Name"
              value={formData.firstName}
              onChange={(e) => setField("firstName", e.target.value)}
            />
            <input
              className={inputClass}
              placeholder="Other Names"
              value={formData.otherNames}
              onChange={(e) => setField("otherNames", e.target.value)}
            />
            <input
              type="date"
              className={inputClass}
              placeholder="Date of Birth"
              value={formData.dateOfBirth}
              onChange={(e) => setField("dateOfBirth", e.target.value)}
            />
            <input
              className={inputClass}
              placeholder="Nationality"
              value={formData.nationality}
              onChange={(e) => setField("nationality", e.target.value)}
            />
            <select
              className={inputClass}
              value={formData.sex}
              onChange={(e) => setField("sex", e.target.value)}
            >
              <option value="">Select Sex</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
        );
      case 2:
        return (
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-[var(--ford-primary)]">
              Contact & Residence
            </h2>
            <input
              className={inputClass}
              placeholder="Postal Address"
              value={formData.postalAddress}
              onChange={(e) => setField("postalAddress", e.target.value)}
            />
            <input
              className={inputClass}
              placeholder="Residential Address"
              value={formData.residentialAddress}
              onChange={(e) => setField("residentialAddress", e.target.value)}
            />
            <input
              className={inputClass}
              placeholder="Ward Lives With"
              value={formData.wardLivesWith}
              onChange={(e) => setField("wardLivesWith", e.target.value)}
            />
            <input
              className={inputClass}
              placeholder="Ward Mobile"
              value={formData.wardMobile}
              onChange={(e) => setField("wardMobile", e.target.value)}
            />
            <input
              type="email"
              className={inputClass}
              placeholder="Ward Email"
              value={formData.wardEmail}
              onChange={(e) => setField("wardEmail", e.target.value)}
            />
            <input
              className={inputClass}
              placeholder="Emergency Contact"
              value={formData.emergencyContact}
              onChange={(e) => setField("emergencyContact", e.target.value)}
            />
            <input
              className={inputClass}
              placeholder="Emergency Medical Contact"
              value={formData.emergencyMedicalContact}
              onChange={(e) =>
                setField("emergencyMedicalContact", e.target.value)
              }
            />
          </div>
        );
      case 3:
        return (
          <div>
            <h2 className="text-lg font-bold text-[var(--ford-primary)]">
              Family Members
            </h2>
            <button
              className="px-3 py-1 bg-[var(--ford-primary)] rounded mb-2"
              onClick={() => setShowFamilyModal(true)}
            >
              Add Family Member
            </button>
            <ul className="space-y-1">
              {formData.familyMembers?.map((f, idx) => (
                <li
                  key={idx}
                  className="flex justify-between items-center bg-[var(--background)] p-2 rounded"
                >
                  <span>
                    {f.relation} - {f.name}
                  </span>
                  <button
                    className="text-[var(--ford-secondary)]"
                    onClick={() => removeFamilyMember(idx)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      case 4:
        return (
          <div>
            <h2 className="text-lg font-bold text-[var(--ford-primary)]">
              Previous Schools
            </h2>
            <button
              className="px-3 py-1 bg-[var(--ford-primary)] rounded mb-2"
              onClick={() => setShowSchoolModal(true)}
            >
              Add Previous School
            </button>
            <ul className="space-y-1">
              {formData.previousSchools?.map((s, idx) => (
                <li
                  key={idx}
                  className="flex justify-between items-center bg-[var(--background)] p-2 rounded"
                >
                  <span>
                    {s.name} - {s.location}
                  </span>
                  <button
                    className="text-[var(--ford-secondary)]"
                    onClick={() => removePreviousSchool(idx)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      case 5:
        return (
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-[var(--ford-primary)]">
              Medical & Special Needs
            </h2>
            <input
              className={inputClass}
              placeholder="Medical Summary"
              value={formData.medicalSummary}
              onChange={(e) => setField("medicalSummary", e.target.value)}
            />
            <input
              className={inputClass}
              placeholder="Blood Type"
              value={formData.bloodType}
              onChange={(e) => setField("bloodType", e.target.value)}
            />
            <input
              className={inputClass}
              placeholder="Special Disability"
              value={formData.specialDisability}
              onChange={(e) => setField("specialDisability", e.target.value)}
            />
          </div>
        );
      case 6:
        return (
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-[var(--ford-primary)]">
              Class & Admission
            </h2>
            <select
              className={inputClass}
              value={formData.classId}
              onChange={(e) => setField("classId", e.target.value)}
            >
              <option value="">Select Class</option>
              {availableClasses.map((c: SchoolClass) => (
                <option key={c.id} value={c.id}>
                  {c.grade} - {c.name}
                </option>
              ))}
            </select>
            <input
              className={inputClass}
              placeholder="Admission PIN"
              value={formData.admissionPin}
              onChange={(e) => setField("admissionPin", e.target.value)}
            />
          </div>
        );
      case 7:
        return (
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-[var(--ford-primary)]">
              Declaration & Submission
            </h2>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.feesAcknowledged}
                onChange={(e) => setField("feesAcknowledged", e.target.checked)}
              />
              <span>Fees Acknowledged</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.declarationSigned}
                onChange={(e) =>
                  setField("declarationSigned", e.target.checked)
                }
              />
              <span>Declaration Signed</span>
            </label>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 text-[var(--typo)]">
      <h1 className="text-2xl font-bold text-[var(--ford-primary)] mb-4">
        Student Admission Form
      </h1>

      {/* Progress Bar */}
      <div className="w-full h-2 rounded bg-[var(--background)] mb-4">
        <div
          className="h-2 rounded bg-[var(--ford-primary)] transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {renderStep()}

      <div className="flex justify-between mt-4">
        {currentStep > 1 && (
          <button
            className="px-3 py-1 bg-[var(--ford-secondary)] rounded"
            onClick={prevStep}
          >
            Previous
          </button>
        )}
        {currentStep < stepCount ? (
          <button
            className="px-3 py-1 bg-[var(--ford-primary)] rounded"
            onClick={nextStep}
          >
            Next
          </button>
        ) : (
          <button
            className="px-3 py-1 bg-[var(--success)] rounded"
            onClick={submitForm}
            disabled={loading || submitted}
          >
            {loading ? "Submitting..." : submitted ? "Submitted" : "Submit"}
          </button>
        )}
      </div>

      {/* Modals */}
      <FamilyMemberModal
        visible={showFamilyModal}
        onClose={() => setShowFamilyModal(false)}
        onSave={(member: FamilyMember) => addFamilyMember(member)}
        title="Add Family Member"
      />

      <PreviousSchoolModal
        visible={showSchoolModal}
        onClose={() => setShowSchoolModal(false)}
        onSave={(school: PreviousSchool) => addPreviousSchool(school)}
        title="Add Previous School"
      />

      {/* Errors */}
      {Object.keys(errors).length > 0 && (
        <div className="mt-4 p-2 bg-[var(--warning)] text-black rounded">
          <h3 className="font-bold">Errors:</h3>
          <ul>
            {Object.entries(errors).map(([field, msgs]) => (
              <li key={field}>
                {field}: {msgs.join(", ")}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// =====================
// Design reasoning
// =====================
// Multi-step admission form with progress bar improves user experience by dividing complex input into logical chunks. Inline modals allow adding nested data without leaving context. Zustand centralizes state for consistency across steps, with reactive validation and error feedback. Ford color variables maintain brand identity.

// =====================
// Structure
// =====================
// - AdmissionPage: main page component
// - renderStep(): renders one of seven steps
// - Navigation buttons: next/previous or submit
// - Progress bar reflects step completion
// - FamilyMemberModal & PreviousSchoolModal handle nested arrays
// - Errors shown in a consistent block

// =====================
// Implementation guidance
// =====================
// - Drop this file in app/admission/page.tsx
// - Import store and modals as shown
// - Bind each input to store.setField for reactive updates
// - Call fetchClasses() on mount to populate class selection
// - submitForm() handles validation and backend submission

// =====================
// Scalability insight
// =====================
// - New steps can be added by updating stepCount and renderStep()
// - Progress bar automatically reflects new steps
// - Modals can be reused for additional nested arrays
// - Zustand store enables draft saving, autosave, or cross-component editing
