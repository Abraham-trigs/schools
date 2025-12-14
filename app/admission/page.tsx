// app/admissions/page.tsx
// Purpose: Admission page with dynamic step renderer wrapped in optimized AuthGuard

"use client";

import dynamic from "next/dynamic";
import AuthGuard from "@/app/components/AuthGuard";

// Dynamically import the multi-step form to ensure client-only rendering
const MultiStepAdmissionForm = dynamic(
  () => import("./components/steps/MultiStepAdmissionForm.tsx"),
  { ssr: false }
);

export default function AdmissionPage() {
  return (
    <AuthGuard redirectOnFail>
      <main className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-5xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8 text-center">
            Student Admission
          </h1>
          <section className="bg-white shadow rounded-lg p-6">
            <MultiStepAdmissionForm />
          </section>
        </div>
      </main>
    </AuthGuard>
  );
}

/* -------------------------------------------------------------------------- */
/* Design reasoning                                                           */
/* -------------------------------------------------------------------------- */
/*
- Uses optimized AuthGuard to fetch user only once if not already in store.
- Dynamic import ensures MultiStepAdmissionForm is rendered client-side only.
- Prevents constant "Checking authentication..." spinner during navigation.
- Clean, centered layout for readability and visual hierarchy.
*/

/* -------------------------------------------------------------------------- */
/* Structure                                                                  */
/* -------------------------------------------------------------------------- */
/*
- AuthGuard -> protects the page
- Container -> max-width, padding
- Header -> centered page title
- Form section -> visually isolated card with shadow and padding
*/

/* -------------------------------------------------------------------------- */
/* Implementation guidance                                                    */
/* -------------------------------------------------------------------------- */
/*
- Wrap any future client-only components in dynamic imports if SSR issues arise.
- AuthGuard ensures that only authenticated users can access this page.
- Page will no longer flicker during modal interactions or dashboard navigation.
*/

/* -------------------------------------------------------------------------- */
/* Scalability insight                                                        */
/* -------------------------------------------------------------------------- */
/*
- Supports dynamic step updates without changes to the page.
- Future modals, notifications, or breadcrumbs can be nested safely.
- Smooth user experience across dashboard and standalone pages.
*/
