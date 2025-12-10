// app/components/admission/MultiStepAdmissionForm.tsx
// Purpose: Multi-step student admission form with labels above inputs, enhanced buttons, and animated step indicators using Framer Motion

"use client";

import React, { useEffect, useState } from "react";
import { useForm, FormProvider, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  admissionFormSchema,
  useAdmissionStore,
} from "@/app/store/admissionStore.ts";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

const STEP_TITLES = [
  "User Info",
  "Personal Info",
  "Languages & Religion",
  "Ward Details",
  "Contact & Emergency",
  "Medical Info",
  "Previous Schools & Family",
  "Fees & Declaration",
];

interface LabeledInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

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
  const router = useRouter(); // initialize router
  const [currentStep, setCurrentStep] = useState(0);
  const { formData, setField, completeStep, loading } = useAdmissionStore();

  const methods = useForm<z.infer<typeof admissionFormSchema>>({
    defaultValues: formData,
    resolver: zodResolver(admissionFormSchema),
    mode: "onChange",
  });

  const {
    handleSubmit,
    register,
    control,
    formState: { errors },
  } = methods;

  useEffect(() => {
    methods.reset(formData);
  }, [formData]);

  const familyArray = useFieldArray({ control, name: "familyMembers" });
  const previousArray = useFieldArray({ control, name: "previousSchools" });

  const onNext = async (data: any) => {
    Object.keys(data).forEach((key) => setField(key, data[key]));
    const success = await completeStep(currentStep);

    if (!success) return;

    if (currentStep < STEP_TITLES.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final step completed → redirect to dashboard
      router.push("/dashboard");
    }
  };

  const onBack = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  const renderStepFields = () => {
    switch (currentStep) {
      case 0:
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
        return (
          <>
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

        {/* Step indicators with Framer Motion */}
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

        {/* Progress bar */}
        <div className="w-full bg-gray-200 h-2 rounded mb-4">
          <div
            className="bg-blue-600 h-2 rounded transition-all"
            style={{ width: `${formData.progress}%` }}
          ></div>
        </div>

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

/*
Design reasoning → Labels above inputs improve readability and accessibility; animated step indicators and progress bar provide clear visual guidance. Buttons now have hover feedback for better UX.
Structure → LabeledInput, MultiStepAdmissionForm; dynamic arrays for family/previous schools; Framer Motion for smooth step transitions.
Implementation guidance → Install framer-motion; drop into project; responsive layout.
Scalability insight → Adding new steps auto-updates indicators and progress bar; LabeledInput reusable in other forms.
*/
