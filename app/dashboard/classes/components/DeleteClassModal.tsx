// app/dashboard/classes/components/DeleteClassModal.tsx
"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { useClassesStore } from "@/store/useClassesStore.ts";

interface DeleteClassModalProps {
  id: string;
  className: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function DeleteClassModal({
  id,
  className,
  isOpen,
  onClose,
  onSuccess,
}: DeleteClassModalProps) {
  const deleteClass = useClassesStore((state) => state.deleteClass);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);

  // ---------------------------
  // Focus cancel button when modal opens
  // ---------------------------
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => cancelButtonRef.current?.focus(), 0);
    }
  }, [isOpen]);

  // ---------------------------
  // Delete handler
  // ---------------------------
  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      const success = await deleteClass(id);
      if (success) {
        onSuccess?.();
        onClose();
      } else {
        setError("Failed to delete class. Try again.");
      }
    } catch (err: any) {
      console.error("Delete failed:", err.message || err);
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------
  // Keyboard & focus trap handler
  // ---------------------------
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (loading) return;

    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "Enter") {
      if (
        document.activeElement === cancelButtonRef.current ||
        document.activeElement === deleteButtonRef.current
      ) {
        handleDelete();
      }
    } else if (e.key === "Tab") {
      const focusable = [
        cancelButtonRef.current,
        deleteButtonRef.current,
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
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
    >
      <div className="bg-white rounded-lg shadow-lg w-full max-w-sm p-6 animate-fade-in">
        <h2 className="text-lg font-semibold mb-4 text-center">
          Confirm Delete
        </h2>

        <p className="mb-6 text-gray-700 text-center">
          Delete <strong className="text-red-600">{className}</strong>? <br />
          Action cannot be <span className="text-red-600">undone.</span>
        </p>

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            ref={cancelButtonRef}
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            ref={deleteButtonRef}
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
