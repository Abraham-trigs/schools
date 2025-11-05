// app/components/subjects/AddSubjectModal.tsx
// Purpose: Modal to create a new subject, aligned with EditSubjectModal and page modal logic.

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSubjectStore } from "@/app/store/subjectStore";

// ------------------------- Schema -------------------------
const addSubjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().optional().nullable(),
});

type AddSubjectFormData = z.infer<typeof addSubjectSchema>;

interface AddSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// ------------------------- Modal Component -------------------------
export default function AddSubjectModal({
  isOpen,
  onClose,
  onSuccess,
}: AddSubjectModalProps) {
  const { createSubject, loading, error } = useSubjectStore();

  const { register, handleSubmit, reset, formState } =
    useForm<AddSubjectFormData>({
      resolver: zodResolver(addSubjectSchema),
      defaultValues: { name: "", code: "" },
    });

  const onSubmit = async (data: AddSubjectFormData) => {
    const result = await createSubject(data);
    if (result) {
      reset();
      if (onSuccess) onSuccess();
      onClose();
    }
  };

  if (!isOpen) return null;

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

          {/* Error feedback */}
          {error && <p className="text-red-500">{error}</p>}

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
- Matches EditSubjectModal for consistent UX and logic.
- Uses isOpen guard to prevent unintended render.
- Keeps store-driven loading/error handling unified.
- Calls both onSuccess (for parent refresh) and onClose (for modal close) to ensure clean flow.
*/
