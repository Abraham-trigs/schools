// app/components/subjects/ConfirmDeleteModal.tsx
// Purpose: Reusable modal to confirm deletion of a subject, handles optimistic UI, error display, and integrates with Zustand store.

import React, { useState } from "react";
import { useSubjectStore } from "@/app/store/subjectStore.ts";

interface ConfirmDeleteModalProps {
  onClose: () => void;
  onSuccess?: () => void; // Callback after successful deletion (e.g., refresh table)
  subjectId: string;
  subjectName: string;
}

export default function ConfirmDeleteModal({
  onClose,
  onSuccess,
  subjectId,
  subjectName,
}: ConfirmDeleteModalProps) {
  const { deleteSubject, loading } = useSubjectStore();
  const [error, setError] = useState<string | null>(null);

  // ------------------------- Delete handler -------------------------
  const handleDelete = async () => {
    try {
      await deleteSubject(subjectId);
      if (onSuccess) onSuccess(); // Refresh table & close modal
    } catch (err: any) {
      setError(err.message);
    }
  };

  // ------------------------- Render -------------------------
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Confirm Delete</h2>
        <p className="mb-4">
          Are you sure you want to delete "<strong>{subjectName}</strong>"? This
          action cannot be undone.
        </p>

        {error && <p className="text-red-500">{error}</p>}

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

/* Design reasoning:
- Provides a clear, focused confirmation modal before destructive actions.
- Uses Zustand store to manage deletion and loading state for optimistic UI feedback.
- Displays errors inline for immediate feedback.

Structure:
- Overlay container with centered modal panel.
- Title, message with subject name, error display, and action buttons.
- Cancel closes modal; Delete triggers store action.

Implementation guidance:
- `onSuccess` should refresh parent list or close modal.
- Disabled state ensures user cannot trigger multiple requests.

Scalability insight:
- Can be reused for any entity deletion by passing `subjectId`/`subjectName` props.
- Easy to extend with additional confirmations or warnings.
*/
