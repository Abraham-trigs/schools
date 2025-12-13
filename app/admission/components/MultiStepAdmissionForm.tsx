// app/components/admission/MultiStepAdmissionForm.tsx
// Purpose: Multi-step student admission form with dynamic class & grade selection, animated step indicators, full validation, family & previous schools handling, React Hook Form + Zod, drop-in production-ready

"use client";

import React, { useEffect, useState } from "react";
import { useForm, FormProvider, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  admissionFormSchema,
  useAdmissionStore,
} from "@/app/store/admissionStore.ts";
import { useClassesStore } from "@/app/store/useClassesStore.ts";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

// Titles for each step of the multi-step form
const STEP_TITLES = [
  "User Info",
  "Personal Info",
  "Languages & Religion",
  "Ward Details",
  "Contact & Emergency",
  "Medical Info",
  "Previous Schools & Family",
  "Fees, Declaration & Class",
];

interface LabeledInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

// Reusable input component with label and inline error display
const LabeledInput: React.FC<LabeledInputProps> = ({
  label,
  error,
  ...props
}) => (
  <div className="flex flex-col w-full mb-4">
    <label className="mb-1 text-gray-700 font-medium">{label}</label>
    <input
      {...props}
      className={`border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        error ? "border-red-500" : "border-gray-300"
      }`}
    />
    {error && <span className="text-red-600 text-xs mt-1">{error}</span>}
  </div>
);

export default function MultiStepAdmissionForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0); // Tracks which step is active
  const { formData, setField, completeStep, loading } = useAdmissionStore();
  const { classes, fetchClasses } = useClassesStore();
  const MAX_CLASS_SIZE = 30; // Maximum students per class

  // Initialize React Hook Form with Zod validation and form store data
  const methods = useForm<z.infer<typeof admissionFormSchema>>({
    defaultValues: formData,
    resolver: zodResolver(admissionFormSchema),
    mode: "onChange",
  });

  const {
    handleSubmit,
    register,
    control,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = methods;

  // Reset form with current store data on mount, and fetch classes
  useEffect(() => {
    reset(formData);
    fetchClasses();
  }, [formData, fetchClasses, reset]);

  // Handle dynamic repeated fields
  const familyArray = useFieldArray({ control, name: "familyMembers" });
  const previousArray = useFieldArray({ control, name: "previousSchools" });

  // Watch selected class to dynamically render grade options
  const selectedClassId = watch("classId");
  const selectedClass = classes.find((cls) => cls.id === selectedClassId);

  // On clicking "Next" or "Submit"
  const onNext = async (data: any) => {
    // Merge form data into global store
    Object.keys(data).forEach((key) => setField(key, data[key]));
    const success = await completeStep(currentStep);
    if (!success) return; // Stop if step cannot be completed

    // Move to next step or redirect on final submission
    if (currentStep < STEP_TITLES.length - 1) setCurrentStep(currentStep + 1);
    else router.push("/dashboard");
  };

  // Navigate back one step
  const onBack = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  // Render input fields based on current step
  const renderStepFields = () => {
    switch (currentStep) {
      case 0:
        // User Info
        return (
          <>
            <LabeledInput
              {...register("surname")}
              label="Surname"
              error={errors.surname?.message as string}
            />
            <LabeledInput
              {...register("firstName")}
              label="First Name"
              error={errors.firstName?.message as string}
            />
            <LabeledInput
              {...register("otherNames")}
              label="Other Names"
              error={errors.otherNames?.message as string}
            />
            <LabeledInput
              {...register("email")}
              type="email"
              label="Email"
              error={errors.email?.message as string}
            />
            <LabeledInput
              {...register("password")}
              type="password"
              label="Password"
              error={errors.password?.message as string}
            />
          </>
        );
      case 1:
        // Personal Info
        return (
          <>
            <LabeledInput
              {...register("dateOfBirth")}
              type="date"
              label="Date of Birth"
              error={errors.dateOfBirth?.message as string}
            />
            <LabeledInput
              {...register("nationality")}
              label="Nationality"
              error={errors.nationality?.message as string}
            />

            {/* Sex Selection */}
            <div className="flex flex-col w-full mb-4">
              <label className="mb-1 text-gray-700 font-medium">Sex</label>
              <select
                {...register("sex")}
                className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Sex</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              {errors.sex && (
                <span className="text-red-600 text-xs mt-1">
                  {errors.sex.message}
                </span>
              )}
            </div>
          </>
        );
      case 2:
        // Languages & Religion
        return (
          <>
            <LabeledInput
              {...register("languages.0")}
              label="Languages (comma separated)"
              error={errors.languages?.[0]?.message as string}
            />
            <LabeledInput
              {...register("mothersTongue")}
              label="Mother's Tongue"
              error={errors.mothersTongue?.message as string}
            />
            <LabeledInput
              {...register("religion")}
              label="Religion"
              error={errors.religion?.message as string}
            />
            <LabeledInput
              {...register("denomination")}
              label="Denomination"
              error={errors.denomination?.message as string}
            />
            <LabeledInput
              {...register("hometown")}
              label="Hometown"
              error={errors.hometown?.message as string}
            />
            <LabeledInput
              {...register("region")}
              label="Region"
              error={errors.region?.message as string}
            />
          </>
        );
      case 3:
        // Ward Details
        return (
          <>
            <LabeledInput
              {...register("profilePicture")}
              label="Profile Picture URL"
              error={errors.profilePicture?.message as string}
            />
            <LabeledInput
              {...register("wardLivesWith")}
              label="Ward Lives With"
              error={errors.wardLivesWith?.message as string}
            />
            <LabeledInput
              {...register("numberOfSiblings", { valueAsNumber: true })}
              type="number"
              label="Number of Siblings"
              error={errors.numberOfSiblings?.message as string}
            />
            <LabeledInput
              {...register("siblingsOlder", { valueAsNumber: true })}
              type="number"
              label="Siblings Older"
              error={errors.siblingsOlder?.message as string}
            />
            <LabeledInput
              {...register("siblingsYounger", { valueAsNumber: true })}
              type="number"
              label="Siblings Younger"
              error={errors.siblingsYounger?.message as string}
            />
          </>
        );
      case 4:
        // Contact & Emergency
        return (
          <>
            <LabeledInput
              {...register("postalAddress")}
              label="Postal Address"
              error={errors.postalAddress?.message as string}
            />
            <LabeledInput
              {...register("residentialAddress")}
              label="Residential Address"
              error={errors.residentialAddress?.message as string}
            />
            <LabeledInput
              {...register("wardMobile")}
              label="Ward Mobile"
              error={errors.wardMobile?.message as string}
            />
            <LabeledInput
              {...register("emergencyContact")}
              label="Emergency Contact"
              error={errors.emergencyContact?.message as string}
            />
            <LabeledInput
              {...register("emergencyMedicalContact")}
              label="Emergency Medical Contact"
              error={errors.emergencyMedicalContact?.message as string}
            />
          </>
        );
      case 5:
        // Medical Info
        return (
          <>
            <LabeledInput
              {...register("medicalSummary")}
              label="Medical Summary"
              error={errors.medicalSummary?.message as string}
            />
            <LabeledInput
              {...register("bloodType")}
              label="Blood Type"
              error={errors.bloodType?.message as string}
            />
            <LabeledInput
              {...register("specialDisability")}
              label="Special Disability"
              error={errors.specialDisability?.message as string}
            />
          </>
        );
      case 6:
        // Previous Schools & Family Members
        return (
          <>
            <h4 className="font-semibold mt-4 mb-2">Previous Schools</h4>
            {previousArray.fields.map((item, idx) => (
              <div
                key={item.id}
                className="flex flex-col gap-2 mb-2 p-2 border rounded"
              >
                <LabeledInput
                  {...register(`previousSchools.${idx}.name`)}
                  label="School Name"
                />
                <LabeledInput
                  {...register(`previousSchools.${idx}.location`)}
                  label="Location"
                />
                <LabeledInput
                  {...register(`previousSchools.${idx}.startDate`)}
                  type="date"
                  label="Start Date"
                />
                <LabeledInput
                  {...register(`previousSchools.${idx}.endDate`)}
                  type="date"
                  label="End Date"
                />
                <button
                  type="button"
                  onClick={() => previousArray.remove(idx)}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                previousArray.append({
                  name: "",
                  location: "",
                  startDate: "",
                  endDate: "",
                })
              }
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition mb-4"
            >
              Add Previous School
            </button>

            <h4 className="font-semibold mt-4 mb-2">Family Members</h4>
            {familyArray.fields.map((item, idx) => (
              <div
                key={item.id}
                className="flex flex-col gap-2 mb-2 p-2 border rounded"
              >
                <LabeledInput
                  {...register(`familyMembers.${idx}.relation`)}
                  label="Relation"
                />
                <LabeledInput
                  {...register(`familyMembers.${idx}.name`)}
                  label="Name"
                />
                <LabeledInput
                  {...register(`familyMembers.${idx}.postalAddress`)}
                  label="Postal Address"
                />
                <LabeledInput
                  {...register(`familyMembers.${idx}.residentialAddress`)}
                  label="Residential Address"
                />
                <button
                  type="button"
                  onClick={() => familyArray.remove(idx)}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                familyArray.append({
                  relation: "",
                  name: "",
                  postalAddress: "",
                  residentialAddress: "",
                })
              }
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
            >
              Add Family Member
            </button>
          </>
        );
      case 7:
        // Fees & Declaration + Class & Grade Selection
        return (
          <>
            {/* Fees & Declaration */}
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register("feesAcknowledged")}
                className="checkbox"
              />{" "}
              Fees Acknowledged
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register("declarationSigned")}
                className="checkbox"
              />{" "}
              Declaration Signed
            </label>
            <LabeledInput
              {...register("signature")}
              label="Signature"
              error={errors.signature?.message as string}
            />

            {/* Class Selection */}
            <div className="flex flex-col w-full mb-4 mt-4">
              <label className="mb-1 text-gray-700 font-medium">
                Select Class
              </label>
              <select
                {...register("classId")}
                onChange={(e) => {
                  setValue("classId", e.target.value);
                  setValue("gradeId", ""); // reset grade when class changes
                }}
                className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Class</option>
                {classes.map((cls) => (
                  <option
                    key={cls.id}
                    value={cls.id}
                    disabled={cls.studentCount >= MAX_CLASS_SIZE}
                  >
                    {cls.name}{" "}
                    {cls.studentCount >= MAX_CLASS_SIZE ? "(Full)" : ""}
                  </option>
                ))}
              </select>
              {errors.classId && (
                <span className="text-red-600 text-xs mt-1">
                  {errors.classId.message}
                </span>
              )}
            </div>

            {/* Grade Selection */}
            {selectedClass && selectedClass.grades && (
              <div className="flex flex-col w-full mb-4">
                <label className="mb-1 text-gray-700 font-medium">
                  Select Grade
                </label>
                <select
                  {...register("gradeId")}
                  className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Grade</option>
                  {selectedClass.grades.map((grade) => (
                    <option
                      key={grade.id}
                      value={grade.id}
                      disabled={grade.studentCount >= MAX_CLASS_SIZE}
                    >
                      {grade.name}{" "}
                      {grade.studentCount >= MAX_CLASS_SIZE ? "(Full)" : ""}
                    </option>
                  ))}
                </select>
                {errors.gradeId && (
                  <span className="text-red-600 text-xs mt-1">
                    {errors.gradeId.message}
                  </span>
                )}
              </div>
            )}
          </>
        );
      default:
        return null;
    }
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit(onNext)}
        className="max-w-3xl mx-auto p-4 flex flex-col gap-4"
      >
        <h2 className="text-xl font-bold mb-4">{STEP_TITLES[currentStep]}</h2>

        {/* Step Indicators */}
        <div className="flex items-center justify-between mb-4">
          {STEP_TITLES.map((title, index) => {
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            return (
              <motion.div
                key={index}
                initial={{ scale: 0.8 }}
                animate={{
                  scale: isActive ? 1.2 : 1,
                  color: isCompleted ? "#2563EB" : "#9CA3AF",
                }}
                className="flex flex-col items-center text-sm font-semibold transition-colors"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    isCompleted
                      ? "border-blue-600 bg-blue-500 text-white"
                      : "border-gray-300"
                  }`}
                >
                  {index + 1}
                </div>
                <span className="mt-1 text-center">{title}</span>
              </motion.div>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 h-2 rounded mb-4">
          <div
            className="bg-blue-600 h-2 rounded transition-all"
            style={{ width: `${formData.progress}%` }}
          ></div>
        </div>

        {/* Animated Step Fields */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            {renderStepFields()}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-4">
          {currentStep > 0 && (
            <button
              type="button"
              onClick={onBack}
              disabled={loading}
              className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 transition"
            >
              Back
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
          >
            {currentStep === STEP_TITLES.length - 1 ? "Submit" : "Next"}
          </button>
        </div>

        {/* Display collective form errors */}
        {Object.keys(errors).length > 0 && (
          <div className="text-red-600 mt-2">
            {Object.entries(errors).map(([key, val]) => (
              <div key={key}>
                {(val as any)?.message || JSON.stringify(val)}
              </div>
            ))}
          </div>
        )}
      </form>
    </FormProvider>
  );
}

/**
Design reasoning:
- Step-based form keeps user focus and simplifies validation.
- Dynamic grade dropdown avoids unnecessary data fetch.
- Inline and collective error displays improve UX.

Structure:
- 8-step form with step indicators and animated progress.
- Repeated fields managed via useFieldArray.
- React Hook Form + Zod for schema validation.

Implementation guidance:
- Keep store in sync with form using setField.
- Reset grade on class change to avoid invalid data.
- Animate transitions with AnimatePresence for smooth UX.

Scalability insight:
- Easily extendable with additional steps or repeated fields.
- Supports large datasets of classes and grades.
- Maintains performance with minimal re-renders due to controlled inputs.
*/
