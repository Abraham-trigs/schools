"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";

export interface HR {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  role?: string;
}

interface HRModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (record: HR) => void;
  recordToEdit?: HR;
}

export default function HRModal({
  isOpen,
  onClose,
  onSuccess,
  recordToEdit,
}: HRModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (recordToEdit) {
      setName(recordToEdit.name);
      setEmail(recordToEdit.email);
      setPhone(recordToEdit.phone || "");
      setDepartment(recordToEdit.department || "");
      setRole(recordToEdit.role || "");
    } else {
      setName("");
      setEmail("");
      setPhone("");
      setDepartment("");
      setRole("");
    }
  }, [recordToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = { name, email, phone, department, role };

    try {
      let res;
      if (recordToEdit?.id) {
        // Edit
        res = await axios.put(`/api/hr?id=${recordToEdit.id}`, payload);
      } else {
        // Create
        res = await axios.post("/api/hr", payload);
      }

      onSuccess(res.data);
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to save record");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 flex items-center justify-center bg-black/40 z-50"
    >
      <motion.form
        onSubmit={handleSubmit}
        className="bg-deepest0 p-6 rounded-lg w-full max-w-md shadow-lg"
      >
        <h2 className="text-xl font-display text-lightGray mb-4">
          {recordToEdit ? "Edit HR Record" : "Add HR Record"}
        </h2>

        <label className="block text-lightGray mb-1">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 mb-3 rounded bg-secondary text-lightGray focus:outline-none focus:ring-2 focus:ring-accentPurple"
          required
        />

        <label className="block text-lightGray mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 mb-3 rounded bg-secondary text-lightGray focus:outline-none focus:ring-2 focus:ring-accentPurple"
          required
        />

        <label className="block text-lightGray mb-1">Phone</label>
        <input
          type="text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full p-2 mb-3 rounded bg-secondary text-lightGray focus:outline-none focus:ring-2 focus:ring-accentPurple"
        />

        <label className="block text-lightGray mb-1">Department</label>
        <input
          type="text"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="w-full p-2 mb-3 rounded bg-secondary text-lightGray focus:outline-none focus:ring-2 focus:ring-accentPurple"
        />

        <label className="block text-lightGray mb-1">Role</label>
        <input
          type="text"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full p-2 mb-4 rounded bg-secondary text-lightGray focus:outline-none focus:ring-2 focus:ring-accentPurple"
        />

        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-secondary text-lightGray rounded hover:bg-deeper transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-accentPurple text-background rounded hover:bg-purple0 transition-colors"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}
