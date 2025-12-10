// app/admissions/steps/Step2PersonalLinguistic.tsx
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
  languages: true,
  mothersTongue: true,
  religion: true,
  denomination: true,
  hometown: true,
  region: true,
});

type StepFormValues = z.infer<typeof stepSchema>;

export default function Step2PersonalLinguistic() {
  const { formData, setField } = useAdmissionStore();

  // Initialize form data, handling array default correctly
  const defaultValues = {
    ...formData,
    languages: formData.languages || [],
  };

  const {
    register,
    watch,
    formState: { errors },
  } = useForm<StepFormValues>({
    resolver: zodResolver(stepSchema),
    defaultValues: defaultValues,
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
        Personal & Linguistic Information
      </h2>

      {/* Note: 'languages' is an array of strings. This simple input handles comma separation for simplicity */}
      <FormInput
        label="Languages Spoken (comma separated)"
        name="languages"
        register={register}
        errors={errors}
        type="textarea"
        // Transform value for the store when watching
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
          setField(
            "languages",
            e.target.value
              .split(",")
              .map((lang) => lang.trim())
              .filter(Boolean)
          );
        }}
      />
      <FormInput
        label="Mother's Tongue"
        name="mothersTongue"
        register={register}
        errors={errors}
      />
      <FormInput
        label="Religion"
        name="religion"
        register={register}
        errors={errors}
      />
      <FormInput
        label="Denomination (Optional)"
        name="denomination"
        register={register}
        errors={errors}
      />
      <FormInput
        label="Hometown"
        name="hometown"
        register={register}
        errors={errors}
      />
      <FormInput
        label="Region"
        name="region"
        register={register}
        errors={errors}
      />
    </div>
  );
}
