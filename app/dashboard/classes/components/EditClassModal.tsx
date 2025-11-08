// app/dashboard/classes/components/EditClassModal.tsx
// Purpose: Modal for editing a class name, fully controlled, optimized for UX, and using correct notification calls

"use client";

import { useState, useEffect } from "react";
import { notify } from "@/lib/helpers/notifications"; // import the object with .success/.error/.info
import { useClassesStore } from "@/app/store/useClassesStore";

interface EditClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  classId: string; // ID of the class to edit
  className: string; // Current class name to prefill input
}

export default function EditClassModal({
  isOpen,
  onClose,
  onSuccess,
  classId,
  className,
}: EditClassModalProps) {
  const { updateClass } = useClassesStore();
  const [name, setName] = useState(""); // Controlled input state
  const [saving, setSaving] = useState(false); // Tracks save/loading state

  // ---------------------------
  // Prefill input whenever modal opens or className changes
  // ---------------------------
  useEffect(() => {
    if (isOpen) setName(className || "");
  }, [isOpen, className]);

  // ---------------------------
  // Handle save/update action
  // ---------------------------
  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      notify.error("Class name cannot be empty"); // Correct usage of notifications object
      return;
    }

    setSaving(true);
    try {
      const result = await updateClass(classId, trimmedName); // Call store update
      if (result.success) {
        notify.success("Class updated successfully"); // Success toast
        onSuccess(); // Parent can refresh list/chart
        onClose();
      } else {
        notify.error(result.error || "Failed to update class"); // Show API error
      }
    } catch (err: any) {
      notify.error(err?.message || "Unexpected error"); // Catch-all error handling
    } finally {
      setSaving(false); // Re-enable input/buttons
    }
  };

  // ---------------------------
  // Do not render modal if closed
  // ---------------------------
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white p-6 rounded-md w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">Edit Class: {className}</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Class Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-ford-primary"
            disabled={saving} // disable input during save
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded border hover:bg-gray-100"
            disabled={saving} // prevent closing mid-save if needed
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className={`px-4 py-2 rounded text-white ${
              saving
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-ford-primary hover:bg-ford-secondary"
            }`}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* Integration notes:
- Use modal like:
  <EditClassModal
    isOpen={editOpen}
    onClose={() => setEditOpen(false)}
    onSuccess={fetchClasses} // refresh list/chart
    classId={selectedClass.id}
    className={selectedClass.name}
  />
- Ensure store provides updateClass(id, name) returning { success: boolean, error?: string }.
*/

/* Design reasoning:
- Calls notify.success/error correctly using the notifications object.
- Controlled input prevents blank/uncontrolled state.
- Save state disables input/buttons, providing UX feedback.
- Minimal props (id + name) reduce coupling to full store object.
*/

/* Structure:
- Props: isOpen, onClose, onSuccess, classId, className
- State: name (input), saving (button state)
- Handlers: handleSave
- Returns: modal JSX with controlled input, buttons, and save feedback
*/

/* Implementation guidance:
- Parent page only needs to pass ID and current name.
- onSuccess triggers list/chart refresh externally.
- Keep store updateClass method returning success/error object.
*/

/* Scalability insight:
- Can extend to edit multiple fields by adding props and updating handleSave.
- Reusable pattern for other single-entity updates by replacing label/API call.
*/
