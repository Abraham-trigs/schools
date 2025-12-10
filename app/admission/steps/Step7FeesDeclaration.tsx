// app/admissions/steps/Step7FeesDeclaration.tsx
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
  feesAcknowledged: true,
  declarationSigned: true,
  signature: true,
});

type StepFormValues = z.infer<typeof stepSchema>;

export default function Step7FeesDeclaration() {
  const { formData, setField } = useAdmissionStore();

  const {
    register,
    watch,
    formState: { errors },
  } = useForm<StepFormValues>({
    resolver: zodResolver(stepSchema),
    defaultValues: {
      feesAcknowledged: formData.feesAcknowledged || false,
      declarationSigned: formData.declarationSigned || false,
      signature: formData.signature || "",
    },
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
        Fees Acknowledgment & Declaration
      </h2>

      <div className="border p-4 rounded-lg bg-blue-50">
        <h3 className="font-semibold mb-2">Acknowledgment of Fees</h3>
        <p className="text-sm mb-3">
          I acknowledge that I have read and understood the current fee
          structure for the school year.
        </p>
        <FormInput
          label="I acknowledge the fees structure"
          name="feesAcknowledged"
          register={register}
          errors={errors}
          type="checkbox"
        />
      </div>

      <div className="border p-4 rounded-lg bg-green-50">
        <h3 className="font-semibold mb-2">Applicant Declaration</h3>
        <p className="text-sm mb-3">
          I declare that all information provided in this form is accurate and
          complete to the best of my knowledge.
        </p>
        <FormInput
          label="I sign this declaration"
          name="declarationSigned"
          register={register}
          errors={errors}
          type="checkbox"
        />
      </div>

      {/* Signature is a placeholder for a signature pad or similar */}
      <FormInput
        label="Digital Signature (Type Full Name)"
        name="signature"
        register={register}
        errors={errors}
      />
    </div>
  );
}
