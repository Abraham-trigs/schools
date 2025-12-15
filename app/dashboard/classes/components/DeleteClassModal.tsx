"use client";

import { useState, useEffect, useRef } from "react";
import { useClassesStore } from "@/app/store/useClassesStore.ts";

interface DeleteClassModalProps {
  id: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function DeleteClassModal({
  id,
  isOpen,
  onClose,
  onSuccess,
}: DeleteClassModalProps) {
  const { deleteClass, classes, clearSelectedClass } = useClassesStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const firstButtonRef = useRef<HTMLButtonElement>(null);

  // Reset error and focus first button when modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setTimeout(() => firstButtonRef.current?.focus(), 0);
    }
  }, [isOpen]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      // Delete class via store
      await deleteClass(id);

      // Optimistically update classes array in store
      useClassesStore.setState((state) => ({
        classes: state.classes.filter((cls) => cls.id !== id),
        selectedClass:
          state.selectedClass?.id === id ? null : state.selectedClass,
      }));

      // Clear any selected class if it was deleted
      clearSelectedClass();

      onSuccess?.(); // parent can refresh table or pagination
      onClose(); // close modal
    } catch (err: any) {
      console.error("Delete failed:", err.message || err);
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
    >
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-lg w-full max-w-sm p-6 animate-fade-in focus:outline-none"
      >
        <h2 className="text-lg font-semibold mb-4">Confirm Delete</h2>
        <p className="mb-6 text-gray-700">
          Are you sure you want to delete this class? This action cannot be
          undone.
        </p>

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            ref={firstButtonRef}
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
