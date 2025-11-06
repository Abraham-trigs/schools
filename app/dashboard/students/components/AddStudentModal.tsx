// app/dashboard/students/components/AddStudentModal.tsx
// Purpose: Modal for adding a student with validation and class selection

"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import clsx from "clsx";
import { useClassesStore } from "@/app/store/useClassesStore";
import { useStudentStore } from "@/app/store/useStudentStore";

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolDomain: string;
  onSuccess?: () => void;
  classId?: string;
}

export default function AddStudentModal({
  isOpen,
  onClose,
  schoolDomain,
  onSuccess,
  classId,
}: AddStudentModalProps) {
  const { classes, fetchClasses } = useClassesStore();
  const { addStudentAsync } = useStudentStore();

  const [name, setName] = useState("");
  const [emailPrefix, setEmailPrefix] = useState("");
  const [password, setPassword] = useState("");
  const [selectedClass, setSelectedClass] = useState(classId ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load classes when modal opens
  useEffect(() => {
    if (!isOpen) return; // ✅ fixed: do not return null
    fetchClasses().catch(() => setError("Failed to load classes"));
  }, [isOpen, fetchClasses]);

  // Auto-select first class when classes are loaded
  useEffect(() => {
    if (classes.length > 0 && !selectedClass) setSelectedClass(classes[0].id);
  }, [classes, selectedClass]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!/^[a-zA-Z0-9._-]+$/.test(emailPrefix)) {
      setError(
        "Email prefix can only contain letters, numbers, dots, underscores, or hyphens."
      );
      setLoading(false);
      return;
    }

    const email = `${emailPrefix.trim()}@${schoolDomain}`;

    try {
      await addStudentAsync({
        name: name.trim(),
        email,
        password: password.trim() || undefined,
        classId: selectedClass,
      });

      // Reset form and close modal
      setName("");
      setEmailPrefix("");
      setPassword("");
      setSelectedClass(classes[0]?.id ?? "");
      onClose();
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || "Failed to add student");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
          <DialogTitle className="text-xl font-semibold mb-4">
            Add Student
          </DialogTitle>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Student Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border px-3 py-2 rounded"
                placeholder="Enter name"
                required
              />
            </div>

            {/* Class */}
            <div>
              <label className="block text-sm font-medium mb-1">Class</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full border px-3 py-2 rounded"
                required
              >
                {classes.length > 0 ? (
                  classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))
                ) : (
                  <option disabled>No classes available</option>
                )}
              </select>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <div className="flex">
                <input
                  type="text"
                  value={emailPrefix}
                  onChange={(e) => setEmailPrefix(e.target.value)}
                  className="w-full border px-3 py-2 rounded-l"
                  placeholder="username"
                  required
                />
                <span className="inline-flex items-center px-3 bg-gray-100 border border-l-0 rounded-r">
                  @{schoolDomain}
                </span>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border px-3 py-2 rounded"
                placeholder="Enter password (optional)"
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            {/* Actions */}
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
                {loading ? "Adding..." : "Add Student"}
              </button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
