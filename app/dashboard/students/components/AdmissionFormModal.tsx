// app/students/components/AdmissionFormModal.tsx
"use client";

import { useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X } from "lucide-react";
import MultiStepAdmissionForm from "@/app/admission/components/steps/MultiStepAdmissionForm";

// ------------------------------------------------------------------------
// Purpose:
// - Modal to handle adding a new student using MultiStepAdmissionForm.
// - Blurred background overlay with smooth transitions.
// - Delegates student list refresh to parent via callback prop.
// ------------------------------------------------------------------------

interface AdmissionFormModalProps {
  // Optional callback to trigger parent refresh of student list
  onStudentAdded?: () => void;
}

export default function AdmissionFormModal({
  onStudentAdded,
}: AdmissionFormModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  // -------------------------
  // Modal control
  // -------------------------
  const openModal = () => setIsOpen(true);

  const closeModal = () => {
    setIsOpen(false);

    // -------------------------
    // Trigger parent update when modal closes
    // -------------------------
    if (onStudentAdded) onStudentAdded();
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={openModal}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Add New Student
      </button>

      {/* Modal with Transition */}
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeModal}>
          {/* Background Overlay with blur */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 backdrop-blur-none"
            enterTo="opacity-30 backdrop-blur-sm"
            leave="ease-in duration-200"
            leaveFrom="opacity-30 backdrop-blur-sm"
            leaveTo="opacity-0 backdrop-blur-none"
          >
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
          </Transition.Child>

          {/* Modal panel */}
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="relative w-full max-w-4xl bg-white rounded shadow-lg p-6">
                  {/* Close Button */}
                  <button
                    onClick={closeModal}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                  >
                    <X size={20} />
                  </button>

                  {/* Multi-Step Form */}
                  <MultiStepAdmissionForm
                    // The form itself doesn’t refresh store
                    onComplete={closeModal}
                  />
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}

/* ------------------------------------------------------------------------
Design reasoning:
- The modal focuses solely on form handling and UI transitions.
- Delegates student list refresh to parent via `onStudentAdded` callback.
- Backdrop blur and opacity enhance visual experience.
- MultiStepAdmissionForm remains unchanged; the modal only closes it.

Implementation guidance:
- Adjust `backdrop-blur` and opacity for desired effect.
- `onStudentAdded` allows parent page to call store fetchStudents.
- Keeps store logic out of modal, improving reusability.

Scalability insight:
- Can reuse modal across other forms while allowing parent to control state.
- Ensures reactive UI updates on modal close without modifying store internally.
------------------------------------------------------------------------ */
