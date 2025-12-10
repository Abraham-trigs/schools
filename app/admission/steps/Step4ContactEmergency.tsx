// app/admissions/steps/Step4ContactEmergency.tsx
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
  postalAddress: true,
  residentialAddress: true,
  wardMobile: true,
  wardEmail: true, // Included in step 1 and 4
  emergencyContact: true,
  emergencyMedicalContact: true,
});

type StepFormValues = z.infer<typeof stepSchema>;

export default function Step4ContactEmergency() {
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
      <h2 className="text-xl font-semibold mb-4">
        Contact & Emergency Information
      </h2>

      <FormInput
        label="Postal Address"
        name="postalAddress"
        register={register}
        errors={errors}
        type="textarea"
      />
      <FormInput
        label="Residential Address"
        name="residentialAddress"
        register={register}
        errors={errors}
        type="textarea"
      />
      <FormInput
        label="Ward Mobile Phone"
        name="wardMobile"
        register={register}
        errors={errors}
      />
      <FormInput
        label="Ward Email (if different)"
        name="wardEmail"
        register={register}
        errors={errors}
        type="email"
      />
      <FormInput
        label="Emergency Contact Name/Number"
        name="emergencyContact"
        register={register}
        errors={errors}
      />
      <FormInput
        label="Emergency Medical Contact (Optional)"
        name="emergencyMedicalContact"
        register={register}
        errors={errors}
      />
    </div>
  );
}
