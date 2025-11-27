"use client";

import React, { useEffect } from "react";
import { useAdmissionStore } from "@/app/store/admissionStore.ts";
import { useUserStore } from "@/app/store/useUserStore.ts";
import Step1CreateUser from "./Step1CreateUser.tsx";
import Step2PersonalDetails from "./Step2PersonalDetails.tsx";
import Step3FamilyMembers from "./Step3FamilyMembers.tsx";
import Step4PreviousSchools from "./Step4PreviousSchools.tsx";
import Step5Medical from "./Step5Medical.tsx";
import Step6ClassAdmission from "./Step6Class.tsx";
import Step7Declaration from "./Step7Declaration.tsx";

const steps = [
  { id: 1, label: "Create User" },
  { id: 2, label: "Personal Details" },
  { id: 3, label: "Family Members" },
  { id: 4, label: "Previous Schools" },
  { id: 5, label: "Medical & Special Needs" },
  { id: 6, label: "Class & Admission" },
  { id: 7, label: "Declaration & Submit" },
];

const stepFields: Record<number, string[]> = {
  2: [
    "surname",
    "firstName",
    "otherNames",
    "dateOfBirth",
    "nationality",
    "sex",
    "languages",
    "mothersTongue",
    "religion",
    "denomination",
    "hometown",
    "region",
    "profilePicture",
    "wardLivesWith",
    "numberOfSiblings",
    "siblingsOlder",
    "siblingsYounger",
    "postalAddress",
    "residentialAddress",
    "wardMobile",
    "wardEmail",
    "emergencyContact",
    "emergencyMedicalContact",
  ],
  3: ["familyMembers"],
  4: ["previousSchools"],
  5: ["medicalSummary", "bloodType", "specialDisability"],
  6: ["classId", "classification", "feesAcknowledged"],
};

export default function MultiStepAdmissionForm() {
  const {
    formData,
    loading,
    errors,
    submitted,
    userCreated,
    setField,
    updateAdmission,
    fetchClasses,
  } = useAdmissionStore();

  const { createUser, markUserCreated } = useUserStore();

  const [currentStep, setCurrentStep] = React.useState(1);
  const progress = ((currentStep - 1) / (steps.length - 1)) * 100;

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const goNext = async () => {
    // Update backend for steps > 1
    if (currentStep > 1 && currentStep < steps.length) {
      const fieldsToUpdate = stepFields[currentStep] || [];
      const partialUpdate: any = {};
      fieldsToUpdate.forEach((key) => {
        partialUpdate[key] = formData[key as keyof typeof formData];
      });
      await updateAdmission(partialUpdate);
    }
    setCurrentStep((s) => Math.min(s + 1, steps.length));
  };

  const goBack = () => setCurrentStep((s) => Math.max(s - 1, 1));

  // Single "Next" button handler
  const handleNext = async () => {
    if (currentStep === 1) {
      if (!formData.firstName || !formData.surname || !formData.wardEmail)
        return;

      try {
        const payload = {
          name: `${formData.firstName} ${formData.surname}`,
          email: formData.wardEmail,
          password: formData.password || "default123",
          role: "STUDENT",
        };

        const user = await createUser(payload);
        if (user?.id) markUserCreated(user.id);
      } catch (err: any) {
        console.error("Error creating user:", err);
        return;
      }
    }

    goNext();
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1CreateUser
            formData={formData}
            setField={setField}
            errors={errors}
            loading={loading}
          />
        );
      case 2:
        return <Step2PersonalDetails formData={formData} setField={setField} />;
      case 3:
        return <Step3FamilyMembers formData={formData} setField={setField} />;
      case 4:
        return <Step4PreviousSchools formData={formData} setField={setField} />;
      case 5:
        return <Step5Medical formData={formData} setField={setField} />;
      case 6:
        return <Step6ClassAdmission formData={formData} setField={setField} />;
      case 7:
        return <Step7Declaration formData={formData} setField={setField} />;
      default:
        return null;
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-24 px-4 sm:px-6 md:px-8 overflow-y-auto backdrop-blur-md pointer-events-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl flex flex-col gap-6 p-4 sm:p-6 max-h-[calc(100vh-6rem)] overflow-y-auto">
        {/* Step Progress */}
        <div className="flex flex-col sm:flex-row justify-between mb-2 sm:mb-4">
          {steps.map((s) => (
            <div
              key={s.id}
              className={`flex-1 text-center border-b-2 py-2 transition-all sm:py-3 ${
                currentStep === s.id
                  ? "border-blue-600 font-semibold text-black"
                  : "border-gray-300 text-gray-500"
              }`}
              aria-current={currentStep === s.id ? "step" : undefined}
            >
              {s.label}
            </div>
          ))}
        </div>

        {/* Current Step */}
        <div className="w-full">{renderStep()}</div>

        {/* Navigation Buttons */}
        <div className="flex justify-between flex-wrap gap-2">
          {currentStep > 1 && (
            <button
              onClick={goBack}
              className="bg-gray-200 text-black px-4 py-2 rounded hover:bg-gray-300 transition"
              aria-label="Go to previous step"
            >
              Back
            </button>
          )}
          <div className="flex gap-2 ml-auto">
            {currentStep < steps.length ? (
              <button
                onClick={handleNext}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                aria-label="Go to next step"
                disabled={
                  loading ||
                  (currentStep === 1 &&
                    (!formData.firstName ||
                      !formData.surname ||
                      !formData.wardEmail))
                }
              >
                {loading && currentStep === 1 ? "Creating..." : "Next"}
              </button>
            ) : (
              <button
                onClick={() => updateAdmission()}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                disabled={loading || submitted}
                aria-label="Submit form"
              >
                {loading ? "Submitting..." : submitted ? "Submitted" : "Submit"}
              </button>
            )}
          </div>
        </div>

        {/* Errors */}
        {Object.keys(errors).length > 0 && (
          <div className="mt-4 p-2 bg-yellow-200 text-black rounded">
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
    </div>
  );
}
