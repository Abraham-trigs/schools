"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";

interface CrudModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title: string;
}

export default function CrudModal({
  isOpen,
  onClose,
  children,
  title,
}: CrudModalProps) {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 flex items-center justify-center bg-black/40 z-50"
    >
      <motion.div className="bg-deepest0 p-6 rounded-lg w-full max-w-md shadow-lg">
        <h2 className="text-xl font-display text-lightGray mb-4">{title}</h2>
        {children}
        <div className="flex justify-end mt-4 space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-secondary text-lightGray rounded hover:bg-deeper transition-colors"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
