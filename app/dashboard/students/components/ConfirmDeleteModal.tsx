"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { StudentDetail, useStudentStore } from "@/app/store/useStudentStore";
import { notify } from "@/lib/helpers/notifications";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  student: StudentDetail | null;
  onClose: () => void;
  onConfirm?: () => Promise<void>; // optional external confirm callback
}

export default function ConfirmDeleteModal({
  isOpen,
  student,
  onClose,
  onConfirm,
}: ConfirmDeleteModalProps) {
  const { deleteStudent } = useStudentStore();
  const [isDeleting, setIsDeleting] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Autofocus the first button on open
  useEffect(() => {
    if (isOpen && dialogRef.current) {
      const firstButton = dialogRef.current.querySelector("button");
      (firstButton as HTMLButtonElement)?.focus();
    }
  }, [isOpen]);

  if (!isOpen || !student) return null;

  const handleConfirm = async () => {
    try {
      setIsDeleting(true);

      if (onConfirm) {
        // Use external confirm callback if provided
        await onConfirm();
      } else {
        // Default: delete via store
        await deleteStudent(student.id);
        notify.success(
          `Student "${
            student.user?.name ?? student.name
          }" deleted successfully.`
        );
      }

      onClose();
    } catch (err) {
      console.error("Delete failed", err);
      notify.error("Failed to delete student. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={dialogRef}
        className="bg-white rounded-2xl shadow-lg p-6 max-w-sm w-full text-center relative"
      >
        <h2 className="text-lg font-semibold mb-2 text-gray-800">
          Delete Student
        </h2>
        <p className="text-gray-600 mb-4">
          Are you sure you want to delete{" "}
          <span className="font-medium text-gray-900">
            {student.user?.name ?? student.name}
          </span>
          ?
          <br />
          This action cannot be undone.
        </p>

        <div className="flex justify-center gap-3 mt-4">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDeleting}
            className={`px-4 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500 ${
              isDeleting
                ? "bg-red-400 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
