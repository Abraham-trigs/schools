// app/dashboard/classes/components/DeleteClassModal.tsx
// Purpose: Modal for confirming and deleting a class, fully controlled, showing class name in warning, with UX-friendly loading and error handling

"use client";

import { useState } from "react";
import { useClassesStore } from "@/app/store/useClassesStore.ts";

interface DeleteClassModalProps {
  id: string; // ID of the class to delete
  className: string; // Name of the class to display in warning
  isOpen: boolean; // Modal open state
  onClose: () => void; // Function to close modal
  onSuccess?: () => void; // Optional callback after successful deletion
}

export default function DeleteClassModal({
  id,
  className,
  isOpen,
  onClose,
  onSuccess,
}: DeleteClassModalProps) {
  const deleteClass = useClassesStore((state) => state.deleteClass);
  const [loading, setLoading] = useState(false); // Track async delete
  const [error, setError] = useState<string | null>(null); // Track error messages

  // ---------------------------
  // Delete handler
  // ---------------------------
  const handleDelete = async () => {
    setLoading(true);
    setError(null); // reset previous errors
    try {
      const success = await deleteClass(id); // call store action
      if (success) {
        onSuccess?.(); // refresh parent list/chart
        onClose(); // close modal
      } else {
        setError("Failed to delete class. Try again."); // UX-friendly error
      }
    } catch (err: any) {
      console.error("Delete failed:", err.message || err);
      setError("An unexpected error occurred."); // fallback error
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------
  // Do not render modal if closed
  // ---------------------------
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-sm p-6 animate-fade-in">
        <h2 className="text-lg font-semibold mb-4">Confirm Delete</h2>
        {/* Display class name in warning */}
        <p className="mb-6 text-gray-700">
          Are you sure you want to delete the class <strong>{className}</strong>
          ? This action cannot be undone.
        </p>

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* Integration notes:
- Parent page should now pass className:
  <DeleteClassModal
    id={currentClass.id}
    className={currentClass.name} // display in warning
    isOpen={deleteOpen}
    onClose={() => setDeleteOpen(false)}
    onSuccess={() => fetchClasses()} // refresh class list
  />
- Store: deleteClass(id) must exist and return boolean for success.
*/

/* Design reasoning:
- Shows selected class name in warning for clear UX.
- Loading state prevents double submission.
- Error state surfaces backend/store issues.
- Minimal props keep modal decoupled and reusable.
*/

/* Structure:
- Props: id, className, isOpen, onClose, onSuccess
- State: loading (async), error (string)
- Handlers: handleDelete
- Returns: modal JSX with confirmation text including className, error feedback, and buttons
*/

/* Implementation guidance:
- Always pass className from parent for context.
- Keep deleteClass returning boolean to drive modal flow.
- Buttons reflect async state for UX clarity.
*/

/* Scalability insight:
- Easily extend to handle batch deletes or undo functionality by adding props and updating handleDelete.
*/
