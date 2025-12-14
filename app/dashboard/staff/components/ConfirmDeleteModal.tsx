// app/dashboard/staff/components/ConfirmDeleteModal.tsx
// Purpose: Accessible confirmation modal for staff deletion with non-blocking toast feedback.

"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Staff, useStaffStore } from "@/app/store/useStaffStore";
import { notify } from "@/lib/helpers/notifications"; // ✅ Added toast helper

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  staff: Staff | null;
  onClose: () => void;
}

export default function ConfirmDeleteModal({
  isOpen,
  staff,
  onClose,
}: ConfirmDeleteModalProps) {
  const { deleteStaff } = useStaffStore();
  const [isDeleting, setIsDeleting] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && dialogRef.current) {
      const firstButton = dialogRef.current.querySelector("button");
      (firstButton as HTMLButtonElement)?.focus();
    }
  }, [isOpen]);

  if (!isOpen || !staff) return null;

  const handleConfirm = async () => {
    try {
      setIsDeleting(true);
      await deleteStaff(staff.id);

      notify.success(`Staff member "${staff.user.name}" deleted successfully.`);
      onClose();
    } catch (err) {
      console.error("Delete failed", err);
      notify.error("Failed to delete staff. Please try again.");
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
          Delete Staff Member
        </h2>
        <p className="text-gray-600 mb-4">
          Are you sure you want to delete{" "}
          <span className="font-medium text-gray-900">{staff.user.name}</span>?
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
