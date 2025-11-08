// app/dashboard/classes/components/EditClassModal.tsx
// Purpose: Modal for editing a class name with keyboard support, focus trap, and full accessibility

"use client";

import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { notify } from "@/lib/helpers/notifications";
import { useClassesStore } from "@/app/store/useClassesStore";

interface EditClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  classId: string;
  className: string;
}

export default function EditClassModal({
  isOpen,
  onClose,
  onSuccess,
  classId,
  className,
}: EditClassModalProps) {
  const { updateClass } = useClassesStore();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const firstButtonRef = useRef<HTMLButtonElement>(null);
  const lastButtonRef = useRef<HTMLButtonElement>(null);

  // ---------------------------
  // Prefill input and autofocus
  // ---------------------------
  useEffect(() => {
    if (isOpen) {
      setName(className || "");
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen, className]);

  // ---------------------------
  // Save handler
  // ---------------------------
  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      notify.error("Class name cannot be empty");
      return;
    }

    setSaving(true);
    try {
      const result = await updateClass(classId, trimmedName);
      if (result.success) {
        notify.success("Class updated successfully");
        onSuccess();
        onClose();
      } else {
        notify.error(result.error || "Failed to update class");
      }
    } catch (err: any) {
      notify.error(err?.message || "Unexpected error");
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------
  // Keyboard & focus trap handler
  // ---------------------------
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (saving) return;

    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "Enter") {
      if ((e.target as HTMLElement).tagName === "INPUT") {
        e.preventDefault();
        handleSave();
      }
    } else if (e.key === "Tab") {
      // Focus trap
      const focusable = [
        inputRef.current,
        firstButtonRef.current,
        lastButtonRef.current,
      ].filter(Boolean) as HTMLElement[];
      if (focusable.length < 2) return;

      const currentIndex = focusable.indexOf(
        document.activeElement as HTMLElement
      );
      if (e.shiftKey) {
        if (currentIndex === 0) {
          e.preventDefault();
          focusable[focusable.length - 1].focus();
        }
      } else {
        if (currentIndex === focusable.length - 1) {
          e.preventDefault();
          focusable[0].focus();
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onKeyDown={handleKeyDown}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <div className="bg-white p-6 rounded-md w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">Edit Class: {className}</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Class Name</label>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-ford-primary"
            disabled={saving}
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            ref={firstButtonRef}
            onClick={onClose}
            className="px-4 py-2 rounded border hover:bg-gray-100"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            ref={lastButtonRef}
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

/* Integration & UX notes:
- Keyboard: Esc closes, Enter saves from input, Tab cycles within modal.
- Autofocus input improves accessibility.
- Focus trap ensures users cannot tab outside modal unintentionally.
*/

/* Scalability insight:
- Easy to extend to multi-input forms: just add refs to focusable elements array.
- Fully accessible modal pattern reusable for other edit forms.
*/
