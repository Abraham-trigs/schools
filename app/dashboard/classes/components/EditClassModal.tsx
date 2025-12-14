"use client";

import { useState, useEffect } from "react";
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
  const { selectedClass, updateClass, loading, clearSelectedClass } =
    useClassesStore();
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  // Keep input synced when a class is selected or changed
  useEffect(() => {
    if (selectedClass) setName(selectedClass.name);
  }, [selectedClass]);

  // Cleanup when modal closes
  useEffect(() => {
    if (!isOpen) {
      setName("");
      setError("");
      clearSelectedClass?.(); // optional: clear store selection when closing
    }
  }, [isOpen, clearSelectedClass]);

  if (!isOpen || !selectedClass) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmed = name.trim();
    if (!trimmed) {
      setError("Class name cannot be empty");
      return;
    }

    const { success } = await updateClass(selectedClass.id, trimmed);

    if (success) {
      onSuccess?.();
      onClose();
    } else {
      setError("Failed to update class. Try again.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <h2 className="text-xl font-semibold mb-4">Edit Class</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Class Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border px-3 py-2 rounded focus:outline-ford-primary"
              placeholder="Enter class name"
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={clsx(
                "px-4 py-2 rounded bg-ford-primary text-white hover:bg-ford-secondary",
                loading && "opacity-50 cursor-not-allowed"
              )}
            >
              {loading ? "Updating..." : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
