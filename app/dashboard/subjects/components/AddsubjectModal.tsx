// app/components/subjects/AddSubjectModal.tsx
// Purpose: Modal form to create a new Subject, with client-side validation, optimistic UI, and state-managed store integration.

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSubjectStore } from "@/app/store/subjectStore.ts";

// ------------------------- Schema -------------------------
const addSubjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().optional().nullable(),
});

type AddSubjectFormData = z.infer<typeof addSubjectSchema>;

interface AddSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ------------------------- Modal Component -------------------------
export default function AddSubjectModal({
  isOpen,
  onClose,
}: AddSubjectModalProps) {
  const { createSubject, loading, error } = useSubjectStore();
  const [success, setSuccess] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState } =
    useForm<AddSubjectFormData>({
      resolver: zodResolver(addSubjectSchema),
      defaultValues: { name: "", code: "" },
    });

  // ------------------------- Submit handler -------------------------
  const onSubmit = async (data: AddSubjectFormData) => {
    const result = await createSubject(data);
    if (result) {
      setSuccess("Subject created successfully");
      reset();
    }
  };

  if (!isOpen) return null;

  // ------------------------- Render -------------------------
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Add Subject</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block mb-1">Name</label>
            <input
              {...register("name")}
              className="w-full border p-2 rounded"
              placeholder="Enter subject name"
              disabled={loading}
            />
            {formState.errors.name && (
              <p className="text-red-500 text-sm">
                {formState.errors.name.message}
              </p>
            )}
          </div>

          {/* Code */}
          <div>
            <label className="block mb-1">Code</label>
            <input
              {...register("code")}
              className="w-full border p-2 rounded"
              placeholder="Enter subject code (optional)"
              disabled={loading}
            />
          </div>

          {/* Feedback */}
          {error && <p className="text-red-500">{error}</p>}
          {success && <p className="text-green-500">{success}</p>}

          {/* Buttons */}
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded"
              disabled={loading}
            >
              {loading ? "Saving..." : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* Design reasoning:
- Minimal, accessible modal with focus on usability and validation.
- Optimistic UI feedback via success/error messages improves user experience.
- Controlled by Zustand store for consistent state management.
Structure:
- Uses react-hook-form with Zod for validation.
- Local state for success feedback; store manages loading/error.
Implementation guidance:
- Can be wired to any parent component; open/close controlled via props.
- Subjects are added immediately via store; handles client-side validation before store call.
Scalability insight:
- Supports additional subject fields or meta-data by extending Zod schema and form inputs without changing modal logic.
*/
