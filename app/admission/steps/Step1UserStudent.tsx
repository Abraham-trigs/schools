// app/admissions/steps/Step1UserStudent.tsx
"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useAdmissionStore,
  admissionFormSchema,
  SchoolClass,
} from "@/app/store/admissionStore.ts";
import FormInput from "../components/FormInput.tsx";

// Define local step schema by picking required fields
const stepSchema = admissionFormSchema.partial().pick({
  surname: true,
  firstName: true,
  wardEmail: true,
  dateOfBirth: true,
  nationality: true,
  sex: true,
  classId: true,
});

type StepFormValues = z.infer<typeof stepSchema>;

export default function Step1UserStudent() {
  const { formData, setField, availableClasses, fetchClasses } =
    useAdmissionStore();

  const {
    register,
    watch,
    formState: { errors },
  } = useForm<StepFormValues>({
    resolver: zodResolver(stepSchema),
    defaultValues: {
      surname: formData.surname || "",
      firstName: formData.firstName || "",
      wardEmail: formData.wardEmail || "",
      dateOfBirth: formData.dateOfBirth || "",
      nationality: formData.nationality || "",
      sex: formData.sex || "",
      classId: formData.classId || "",
    },
    mode: "onChange",
  });

  // Fetch available classes when the component mounts
  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  // Sync form values with the store on change
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name) setField(name, value[name]);
    });
    return () => subscription.unsubscribe();
  }, [watch, setField]);

  const classOptions = availableClasses.map((c: SchoolClass) => ({
    value: c.id,
    label: `${c.name} (Grade ${c.grade})`,
  }));

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">
        Student and Account Information
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        Completing this first step creates your application record and temporary
        user account.
      </p>

      <FormInput
        label="Surname"
        name="surname"
        register={register}
        errors={errors}
      />
      <FormInput
        label="First Name"
        name="firstName"
        register={register}
        errors={errors}
      />
      <FormInput
        label="Ward's Email (for login)"
        name="wardEmail"
        register={register}
        errors={errors}
        type="email"
      />
      <FormInput
        label="Date of Birth"
        name="dateOfBirth"
        register={register}
        errors={errors}
        type="date"
      />
      <FormInput
        label="Nationality"
        name="nationality"
        register={register}
        errors={errors}
      />
      <FormInput
        label="Sex"
        name="sex"
        register={register}
        errors={errors}
        type="select"
        options={[
          { value: "Male", label: "Male" },
          { value: "Female", label: "Female" },
        ]}
      />
      <FormInput
        label="Desired Class"
        name="classId"
        register={register}
        errors={errors}
        type="select"
        options={classOptions}
      />
    </div>
  );
}
