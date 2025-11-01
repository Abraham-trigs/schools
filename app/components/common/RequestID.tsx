"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface RequestIDProps {
  isOpen: boolean;
  onConfirm: (schoolId: string) => void;
  onClose?: () => void;
}

export default function RequestID({
  isOpen,
  onConfirm,
  onClose,
}: RequestIDProps) {
  const [schoolId, setSchoolId] = useState("");

  const handleConfirm = () => {
    if (schoolId.trim()) {
      onConfirm(schoolId.trim());
      setSchoolId("");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex justify-center items-center z-50"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8 }}
            className="bg-surface p-6 rounded-xl shadow-lg w-96"
          >
            <h3 className="text-xl font-display text-primary mb-4 text-center">
              Enter School ID
            </h3>
            <input
              type="text"
              placeholder="Enter school ID"
              className="w-full p-3 mb-4 rounded bg-background border border-muted focus:outline-none focus:ring-2 focus:ring-secondary text-white"
              value={schoolId}
              onChange={(e) => setSchoolId(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              {onClose && (
                <button
                  className="px-4 py-2 rounded bg-muted text-background hover:bg-purpleBright transition-colors"
                  onClick={onClose}
                >
                  Cancel
                </button>
              )}
              <button
                className="px-4 py-2 rounded bg-primary text-background hover:bg-purpleBright transition-colors"
                onClick={handleConfirm}
              >
                Confirm
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
