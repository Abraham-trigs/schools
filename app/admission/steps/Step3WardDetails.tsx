// app/admissions/steps/Step3WardDetails.tsx
"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useAdmissionStore,
  admissionFormSchema,
} from "../../store/admissionStore.ts";
import FormInput from "../components/FormInput.tsx";

const stepSchema = admissionFormSchema.partial().pick({
  profilePicture: true,
  wardLivesWith: true,
  numberOfSiblings: true,
  siblingsOlder: true,
  siblingsYounger: true,
});

type StepFormValues = z.infer<typeof stepSchema>;

export default function Step3WardDetails() {
  const { formData, setField } = useAdmissionStore();

  const {
    register,
    watch,
    formState: { errors },
  } = useForm<StepFormValues>({
    resolver: zodResolver(stepSchema),
    defaultValues: {
      ...formData,
      numberOfSiblings: formData.numberOfSiblings || undefined,
      siblingsOlder: formData.siblingsOlder || undefined,
      siblingsYounger: formData.siblingsYounger || undefined,
    },
    mode: "onChange",
  });

  useEffect(() => {
    const subscription = watch((value, { name }) => {
      // Need to convert number inputs from string back to number for the store/zod
      if (
        name &&
        (name === "numberOfSiblings" ||
          name === "siblingsOlder" ||
          name === "siblingsYounger")
      ) {
        setField(
          name,
          value[name] ? parseInt(String(value[name]), 10) : undefined
        );
      } else if (name) {
        setField(name, value[name]);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, setField]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">
        Ward Details & Family Structure
      </h2>

      {/* This is a simple text input placeholder for a complex file upload mechanism */}
      <FormInput
        label="Profile Picture URL (Placeholder)"
        name="profilePicture"
        register={register}
        errors={errors}
      />

      <FormInput
        label="Ward lives with"
        name="wardLivesWith"
        register={register}
        errors={errors}
        type="select"
        options={[
          { value: "Parents", label: "Both Parents" },
          { value: "Mother", label: "Mother Only" },
          { value: "Father", label: "Father Only" },
          { value: "Guardian", label: "Legal Guardian" },
          { value: "Other", label: "Other" },
        ]}
      />
      <FormInput
        label="Number of Siblings"
        name="numberOfSiblings"
        register={register}
        errors={errors}
        type="number"
      />
      <FormInput
        label="Siblings Older"
        name="siblingsOlder"
        register={register}
        errors={errors}
        type="number"
      />
      <FormInput
        label="Siblings Younger"
        name="siblingsYounger"
        register={register}
        errors={errors}
        type="number"
      />
    </div>
  );
}
