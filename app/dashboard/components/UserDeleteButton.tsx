// src/components/UserDeleteButton.tsx
// Purpose: Reusable button that confirms deletion of a user and calls useUserStore.deleteUser with full UX and accessibility.

"use client";

import React, { useState } from "react";
import { Dialog } from "@headlessui/react";
import { useUserStore } from "@/app/store/useUserStore.ts";

// ------------------- Types -------------------
interface UserDeleteButtonProps {
  userId: string;
  userName?: string;
  className?: string;
}

// ------------------- Design reasoning -------------------
// - Confirms destructive action (delete) before calling store.
// - Accessible modal with focus trap and clear messaging.
// - Reusable across tables, lists, or anywhere delete action is needed.
// - Integrates with Zustand store for optimistic update and notifications.

export const UserDeleteButton: React.FC<UserDeleteButtonProps> = ({
  userId,
  userName,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { deleteUser } = useUserStore();
  const [isDeleting, setIsDeleting] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteUser(userId);
      closeModal();
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={openModal}
        className={`bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition ${className}`}
        disabled={isDeleting}
      >
        Delete
      </button>

      <Dialog
        open={isOpen}
        onClose={closeModal}
        className="fixed inset-0 z-50 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen px-4">
          <Dialog.Overlay className="fixed inset-0 bg-black/30" />

          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative z-10">
            <Dialog.Title className="text-lg font-semibold mb-4">
              Confirm Delete
            </Dialog.Title>
            <p className="mb-6">
              Are you sure you want to delete{" "}
              <span className="font-semibold">{userName || "this user"}</span>?
              This action cannot be undone.
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded border hover:bg-gray-100 transition"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50"
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      </Dialog>
    </>
  );
};

// ------------------- Implementation guidance -------------------
// import { UserDeleteButton } from "@/components/UserDeleteButton";
// import { useUserStore } from "../../store/useUserStore";
// <UserDeleteButton userId={user.id} userName={user.name} />

// ------------------- Scalability insight -------------------
// - Can reuse this modal pattern for other destructive actions (Staff, Classes, Departments).
// - Focus trap ensures accessibility; easily extended to multi-step confirmations.
