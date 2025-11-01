"use client";

import { useState } from "react";
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
  const deleteClass = useClassesStore((state) => state.deleteClass);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      const success = await deleteClass(id);
      if (success) {
        onSuccess?.(); // refresh class list
        onClose(); // close modal
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-sm p-6 animate-fade-in">
        <h2 className="text-lg font-semibold mb-4">Confirm Delete</h2>
        <p className="mb-6 text-gray-700">
          Are you sure you want to delete this class? This action cannot be
          undone.
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
