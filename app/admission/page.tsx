// app/admission/page.tsx
"use client";

import AuthGuard from "@/app/components/AuthGuard";
import MultiStepAdmissionForm from "./components/form/AdmissionFormWrapper";

export default function AdmissionPage() {
  return (
    <AuthGuard>
      <div className="max-w-5xl mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Student Admission</h1>
        <MultiStepAdmissionForm />
      </div>
    </AuthGuard>
  );
}
