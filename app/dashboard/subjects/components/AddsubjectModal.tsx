// app/dashboard/subjects/components/AddSubjectModal.tsx
"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSubjectsStore, Subject } from "@/app/store/subjectStore.ts";

// ------------------------- Schema -------------------------
const addSubjectSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  code: z
    .string()
    .optional()
    .nullable()
    .transform((v) => v?.toUpperCase() ?? null),
  description: z
    .string()
    .optional()
    .nullable()
    .transform((v) => v?.trim() ?? null),
});

type AddSubjectFormData = z.infer<typeof addSubjectSchema>;

interface AddSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newSubject: Subject) => void;
}

// ------------------------- Modal Component -------------------------
export default function AddSubjectModal({
  isOpen,
  onClose,
  onSuccess,
}: AddSubjectModalProps) {
  const { createSubject, loadingCreate, error } = useSubjectsStore();

  const { register, handleSubmit, reset, formState } =
    useForm<AddSubjectFormData>({
      resolver: zodResolver(addSubjectSchema),
      defaultValues: { name: "", code: "", description: "" },
    });

  const onSubmit = async (data: AddSubjectFormData) => {
    const newSubject = await createSubject(data);
    if (newSubject) {
      reset();
      onSuccess?.(newSubject); // pass the created subject to parent for table update
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Add Subject</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block mb-1 font-medium">Name</label>
            <input
              {...register("name")}
              className="w-full border p-2 rounded focus:outline-none focus:ring focus:ring-ford-primary"
              placeholder="Enter subject name"
              disabled={loadingCreate}
            />
            {formState.errors.name && (
              <p className="text-red-500 text-sm mt-1">
                {formState.errors.name.message}
              </p>
            )}
          </div>

          {/* Code */}
          <div>
            <label className="block mb-1 font-medium">Code</label>
            <input
              {...register("code")}
              className="w-full border p-2 rounded focus:outline-none focus:ring focus:ring-ford-primary"
              placeholder="Enter subject code (optional)"
              disabled={loadingCreate}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block mb-1 font-medium">Description</label>
            <textarea
              {...register("description")}
              className="w-full border p-2 rounded focus:outline-none focus:ring focus:ring-ford-primary"
              placeholder="Enter subject description (optional)"
              rows={3}
              disabled={loadingCreate}
            />
          </div>

          {/* Error feedback */}
          {error && <p className="text-red-500">{error}</p>}

          {/* Buttons */}
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
              disabled={loadingCreate}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-ford-primary text-white rounded hover:bg-ford-secondary"
              disabled={loadingCreate}
            >
              {loadingCreate ? "Saving..." : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/*
✅ Updates:
1. Replaced generic `loading` with `loadingCreate` for per-action isolation.
2. Preserves current UX, inline error handling, and RHF validation.
3. Ready for future store reset and bulk features without UI changes.
*/
