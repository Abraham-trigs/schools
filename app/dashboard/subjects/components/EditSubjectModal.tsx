"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSubjectsStore, Subject } from "@/app/store/subjectStore.ts";

// ------------------------- Schema -------------------------
const editSubjectSchema = z.object({
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

type EditSubjectFormData = z.infer<typeof editSubjectSchema>;

interface EditSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjectId: string;
  onSuccess?: () => void;
}

// ------------------------- Modal Component -------------------------
export default function EditSubjectModal({
  isOpen,
  onClose,
  subjectId,
  onSuccess,
}: EditSubjectModalProps) {
  const { subjects, updateSubject, loadingUpdate, error } = useSubjectsStore();

  const subject = subjects.find((s) => s.id === subjectId) || null;

  const { register, handleSubmit, reset, formState } =
    useForm<EditSubjectFormData>({
      resolver: zodResolver(editSubjectSchema),
    });

  // ------------------------- Reset form when subject changes -------------------------
  useEffect(() => {
    if (subject) {
      reset({
        name: subject.name,
        code: subject.code,
        description: subject.description ?? "",
      });
    }
  }, [subject, reset]);

  // ------------------------- Submit handler -------------------------
  const onSubmit = async (data: EditSubjectFormData) => {
    const updated = await updateSubject(subjectId, data);
    if (updated) {
      onSuccess?.();
      onClose();
    }
  };

  if (!isOpen) return null;
  if (!subject && loadingUpdate)
    return <div className="text-center py-4">Loading subject...</div>;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Edit Subject</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block mb-1 font-medium">Name</label>
            <input
              {...register("name")}
              className="w-full border p-2 rounded focus:outline-none focus:ring focus:ring-ford-primary"
              placeholder="Enter subject name"
              disabled={loadingUpdate}
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
              disabled={loadingUpdate}
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
              disabled={loadingUpdate}
            />
          </div>

          {/* Created by info */}
          {subject?.createdBy && (
            <div className="text-sm text-gray-600">
              Created by: <strong>{subject.createdBy.name}</strong> (
              {subject.createdBy.role})
            </div>
          )}

          {/* Feedback */}
          {error && <p className="text-red-500">{error}</p>}

          {/* Buttons */}
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
              disabled={loadingUpdate}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-ford-primary text-white rounded hover:bg-ford-secondary"
              disabled={loadingUpdate}
            >
              {loadingUpdate ? "Saving..." : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/*
✅ Updates:
1. Uses `loadingUpdate` instead of generic `loading` for per-action isolation.
2. Keeps form reactive to store changes.
3. Prepares modal for bulk updates or store reset in future.
*/
