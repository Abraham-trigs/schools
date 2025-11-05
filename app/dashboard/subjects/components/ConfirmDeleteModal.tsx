// app/components/subjects/ConfirmDeleteModal.tsx
// Purpose: Modal to confirm deletion of a subject with store integration and optimistic UI

import React, { useState } from "react";
import { useSubjectStore } from "@/app/store/subjectStore.ts";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjectId: string;
  subjectName: string;
}

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  subjectId,
  subjectName,
}: ConfirmDeleteModalProps) {
  const { deleteSubject, loading } = useSubjectStore();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleDelete = async () => {
    try {
      await deleteSubject(subjectId);
      setSuccess(`Deleted "${subjectName}" successfully`);
      setTimeout(() => {
        onClose();
        setSuccess(null);
      }, 1000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Confirm Delete</h2>
        <p className="mb-4">
          Are you sure you want to delete the subject "
          <strong>{subjectName}</strong>"? This action cannot be undone.
        </p>

        {error && <p className="text-red-500">{error}</p>}
        {success && <p className="text-green-500">{success}</p>}

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
            type="button"
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded"
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

/*
Design reasoning:
- Provides clear confirmation to prevent accidental deletions.
- Optimistic UI: closes modal after successful deletion with brief success message.
- Integrates directly with the store for consistency with other subject CRUD operations.

Structure:
- Props: isOpen, onClose, subjectId, subjectName
- handleDelete: calls store deleteSubject
- Inline feedback: error/success

Implementation guidance:
- Use in subject table row delete action.
- Can extend to handle multi-select deletes by passing array of IDs.
- Button states disabled during loading for clear UX.

Scalability insight:
- Can add undo option or soft-delete feature without major refactor.
- Pattern reusable for other entities requiring delete confirmation.
*/
