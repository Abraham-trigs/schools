"use client";

import { motion } from "framer-motion";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  message?: string;
};

export default function DeleteModal({
  isOpen,
  onClose,
  onConfirm,
  message,
}: Props) {
  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-background p-6 rounded-lg w-full max-w-sm"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
      >
        <h2 className="text-xl font-semibold text-primary mb-4">
          Confirm Delete
        </h2>
        <p className="text-lightGray mb-4">
          {message || "Are you sure you want to delete this exam?"}
        </p>
        <div className="flex justify-end space-x-2">
          <button
            className="px-4 py-2 bg-secondary text-lightGray rounded hover:bg-deeper transition-colors"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-error text-background rounded hover:bg-errorPink transition-colors"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Delete
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
