// app/admissions/steps/Step5MedicalInfo.tsx
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
  medicalSummary: true,
  bloodType: true,
  specialDisability: true,
});

type StepFormValues = z.infer<typeof stepSchema>;

export default function Step5MedicalInfo() {
  const { formData, setField } = useAdmissionStore();

  const {
    register,
    watch,
    formState: { errors },
  } = useForm<StepFormValues>({
    resolver: zodResolver(stepSchema),
    defaultValues: formData,
    mode: "onChange",
  });

  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name) setField(name, value[name]);
    });
    return () => subscription.unsubscribe();
  }, [watch, setField]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">Medical Information</h2>

      <FormInput
        label="Medical Summary / Allergies (Optional)"
        name="medicalSummary"
        register={register}
        errors={errors}
        type="textarea"
      />
      <FormInput
        label="Blood Type (Optional)"
        name="bloodType"
        register={register}
        errors={errors}
        type="select"
        options={[
          { value: "O+", label: "O+" },
          { value: "O-", label: "O-" },
          { value: "A+", label: "A+" },
          { value: "A-", label: "A-" },
          { value: "B+", label: "B+" },
          { value: "B-", label: "B-" },
          { value: "AB+", label: "AB+" },
          { value: "AB-", label: "AB-" },
          { value: "", label: "Not Known" },
        ]}
      />
      <FormInput
        label="Special Disability/Needs (Optional)"
        name="specialDisability"
        register={register}
        errors={errors}
        type="textarea"
      />
    </div>
  );
}
