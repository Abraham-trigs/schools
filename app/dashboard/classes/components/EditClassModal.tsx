"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { useClassesStore } from "@/app/store/useClassesStore.ts";

interface EditClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function EditClassModal({
  isOpen,
  onClose,
  onSuccess,
}: EditClassModalProps) {
  const {
    selectedClass,
    updateClass,
    loading,
    clearSelectedClass,
    setClassData,
  } = useClassesStore();

  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Sync input with selected class when modal opens
  useEffect(() => {
    if (isOpen && selectedClass) {
      setName(selectedClass.name);
      setError(null);
    }
  }, [isOpen, selectedClass]);

  // Cleanup state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setName("");
      setError(null);
      clearSelectedClass?.();
    }
  }, [isOpen, clearSelectedClass]);

  if (!isOpen || !selectedClass) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Class name cannot be empty.");
      return;
    }

    if (trimmedName === selectedClass.name) {
      onClose();
      return;
    }

    try {
      const result = await updateClass(selectedClass.id, trimmedName);

      if (result?.success && result.data) {
        // Immediately update store to reflect changes
        setClassData(result.data);

        onSuccess?.();
        onClose();
      } else {
        setError(
          result?.error ??
            "Unable to update class. Please check your connection and try again."
        );
      }
    } catch (err: any) {
      setError(err?.message ?? "Unexpected error while updating class.");
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    >
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-xl font-semibold">Edit Class</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="class-name"
              className="mb-1 block text-sm font-medium"
            >
              Class name
            </label>
            <input
              id="class-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              disabled={loading}
              className="w-full rounded border px-3 py-2 focus:outline-ford-primary disabled:bg-gray-100"
              placeholder="e.g. Grade 6"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded bg-gray-200 px-4 py-2 hover:bg-gray-300 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className={clsx(
                "rounded bg-ford-primary px-4 py-2 text-white hover:bg-ford-secondary",
                loading && "cursor-not-allowed opacity-50"
              )}
            >
              {loading ? "Updating…" : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
