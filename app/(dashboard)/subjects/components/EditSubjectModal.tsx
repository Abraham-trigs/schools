// app/components/subjects/EditSubjectModal.tsx
// Purpose: Modal form to edit an existing Subject, fetches preloaded data, shows related staff/classes, with optimistic UI updates.

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSubjectStore } from "@/app/store/subjectStore";

// ------------------------- Schema -------------------------
const editSubjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().optional().nullable(),
});

type EditSubjectFormData = z.infer<typeof editSubjectSchema>;

interface EditSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjectId: string;
  onSuccess?: () => void; // ✅ added callback
}

// ------------------------- Modal Component -------------------------
export default function EditSubjectModal({
  isOpen,
  onClose,
  subjectId,
  onSuccess,
}: EditSubjectModalProps) {
  const { updateSubject } = useSubjectStore();
  const [subject, setSubject] = useState<EditSubjectFormData & any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState } =
    useForm<EditSubjectFormData>({
      resolver: zodResolver(editSubjectSchema),
    });

  // ------------------------- Fetch subject data on open -------------------------
  useEffect(() => {
    if (isOpen && subjectId) {
      setLoading(true);
      fetch(`/api/subjects/${subjectId}`)
        .then((res) => res.json())
        .then((data) => {
          setSubject(data);
          reset({ name: data.name, code: data.code });
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [isOpen, subjectId, reset]);

  // ------------------------- Submit handler -------------------------
  const onSubmit = async (data: EditSubjectFormData) => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const updated = await updateSubject(subjectId, data);
      if (updated) {
        setSuccess("Subject updated successfully");
        onSuccess?.(); // ✅ trigger parent refresh
      }
    } catch (err: any) {
      setError(err.message || "Failed to update subject");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;
  if (loading && !subject) return <div>Loading subject...</div>;

  // ------------------------- Render -------------------------
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Edit Subject</h2>

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

          {/* Created by info */}
          {subject?.createdBy && (
            <div>
              <strong>Created by:</strong> {subject.createdBy.name} (
              {subject.createdBy.role})
            </div>
          )}

          {/* Feedback */}
          {error && <p className="text-red-500">{error}</p>}
          {success && <p className="text-green-500">{success}</p>}

          {/* Buttons */}
          <div className="flex justify-end space-x-2 mt-4">
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
              {loading ? "Saving..." : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* Design reasoning:
- Added onSuccess for parent-level control (refresh + close modal).
- Keeps validation and error boundaries self-contained.
- Loading guard ensures data consistency when opening modal.

Scalability insight:
- Can easily extend to include related entities (staff/class assignment).
- Pattern matches Add/Delete modals for predictable behavior.
*/
