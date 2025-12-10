// app/admissions/page.tsx
// Purpose: Admission page with dynamic step renderer wrapped in AuthGuard for authentication

"use client";

import dynamic from "next/dynamic";
import AuthGuard from "@/app/components/AuthGuard.tsx";

// Dynamically import the step renderer to ensure it only runs on the client
const StepRenderer = dynamic(() => import("./StepRenderer"), { ssr: false });

export default function AdmissionPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-100 py-10">
        <div className="max-w-5xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-6">Student Admission</h1>
          <StepRenderer />
        </div>
      </div>
    </AuthGuard>
  );
}

/* 
Design reasoning:
- Wrapping the dynamic StepRenderer in AuthGuard ensures only authenticated users can access the form.
- Dynamic import with `ssr: false` prevents server-side rendering issues for client-only components.

Structure:
- Outer AuthGuard -> ensures auth.
- Container div -> min height + padding + background.
- Inner container -> max width for readability, centered.
- Header + dynamic form component.

Implementation guidance:
- Keep StepRenderer purely client-side to avoid hydration errors.
- Ensure AuthGuard correctly provides redirect or fallback for unauthorized users.

Scalability insight:
- This structure allows future expansion: add breadcrumbs, tabs, or notifications inside the inner container.
- Dynamic import ensures performance is not impacted by heavy form logic until user is authenticated.
*/
