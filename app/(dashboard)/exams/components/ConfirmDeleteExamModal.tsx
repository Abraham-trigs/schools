"use client";

import { Dialog } from "@headlessui/react";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useExamStore } from "@/app/store/examsStore.ts";

interface ConfirmDeleteExamModalProps {
  isOpen?: boolean;
  exam: any;
  onClose: () => void;
}

export default function ConfirmDeleteExamModal({
  isOpen = true,
  exam,
  onClose,
}: ConfirmDeleteExamModalProps) {
  const { deleteExam } = useExamStore();
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    await deleteExam(exam.id);
    setLoading(false);
    onClose(); // close modal after deletion
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
    >
      <Dialog.Panel className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <Dialog.Title className="text-lg font-medium">
            Delete Exam
          </Dialog.Title>
        </div>

        <p className="text-gray-700">
          Are you sure you want to delete <strong>{exam.subject}</strong>?
        </p>

        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2"
            disabled={loading}
          >
            <Trash2 size={16} />
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
}
