"use client";

import { useState } from "react";
import clsx from "clsx";
import { z } from "zod";
import { toast } from "sonner";
import { useClassesStore } from "@/app/store/useClassesStore.ts";

interface AddClassModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const classSchema = z.object({
  name: z.string().min(1, "Class name is required"),
});

export default function AddClassModal({ isOpen, onClose }: AddClassModalProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { createClass } = useClassesStore();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const parsed = classSchema.safeParse({ name });
    if (!parsed.success) {
      setError(parsed.error.errors.map((e) => e.message).join(", "));
      setLoading(false);
      return;
    }

    try {
      const result = await createClass(name);

      if (!result.success) {
        toast.error(result.error || "Failed to create class");
        setError(result.error || "Failed to create class");
        setLoading(false);
        return;
      }

      toast.success(
        `Class "${name}" created successfully with grades: A, B, C!`
      );
      setName("");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Unexpected error while creating class.");
      setError("Unexpected error while creating class.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <h2 className="text-xl font-semibold mb-4">Add Class</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Class Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-ford-primary"
              placeholder="Enter class name"
              required
              autoFocus
            />
            <p className="text-gray-500 text-sm mt-1">
              Grades "A", "B", and "C" will be created automatically.
            </p>
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
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
