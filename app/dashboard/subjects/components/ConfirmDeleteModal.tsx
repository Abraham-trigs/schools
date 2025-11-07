// app/components/subjects/ConfirmDeleteModal.tsx
// Purpose: Reusable modal to confirm deletion of a subject, handles optimistic UI, error display, and integrates with Zustand store.

import React, { useState } from "react";
import { useSubjectsStore } from "@/app/store/subjectStore.ts";

interface ConfirmDeleteModalProps {
  onClose: () => void;
  onSuccess?: () => void; // Callback after successful deletion
  subjectId: string;
  subjectName: string;
  subjectClasses?: { id: string; name: string }[];
}

export default function ConfirmDeleteModal({
  onClose,
  onSuccess,
  subjectId,
  subjectName,
  subjectClasses = [],
}: ConfirmDeleteModalProps) {
  const { deleteSubject, loadingDelete } = useSubjectsStore();
  const [error, setError] = useState<string | null>(null);

  // ------------------------- Delete handler -------------------------
  const handleDelete = async () => {
    try {
      const success = await deleteSubject(subjectId);
      if (success && onSuccess) onSuccess(); // Refresh table & close modal
    } catch (err: any) {
      setError(err.message || "Failed to delete");
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

        {subjectClasses.length > 0 && (
          <div className="mb-4 text-sm text-gray-700">
            Assigned Classes: {subjectClasses.map((c) => c.name).join(", ")}
          </div>
        )}

        {error && <p className="text-red-500 mb-2">{error}</p>}

        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded"
            disabled={loadingDelete}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded"
            disabled={loadingDelete}
          >
            {loadingDelete ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* Design reasoning:
- Overlay ensures the user focuses on the destructive action.
- Shows assigned classes to give context before deletion.
- Zustand manages deletion state, providing loading and optimistic UI feedback.
- Inline errors provide immediate feedback.

Structure:
- Overlay → Modal container → Title → Message → Assigned classes → Error → Actions
- Cancel closes modal, Delete triggers store action.

Implementation guidance:
- `onSuccess` refreshes parent page or closes modal.
- Disabled state prevents duplicate clicks.

Scalability insight:
- Can handle any entity with a name and optional metadata.
- Easily extendable with multiple entities, analytics, or extra warnings.
*/
