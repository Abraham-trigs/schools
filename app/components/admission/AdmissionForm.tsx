"use client";

import React, { useState, useEffect } from "react";
import { FamilyMember, PreviousSchool } from "@/app/stores/admissionStore";

// =====================
// Generic modal type
// =====================
interface ModalProps<T> {
  visible: boolean;
  onClose: () => void;
  onSave: (item: T) => void;
  initialData?: T;
  title: string;
}

// =====================
// Family Member Modal
// =====================
export function FamilyMemberModal({
  visible,
  onClose,
  onSave,
  initialData,
  title,
}: ModalProps<FamilyMember>) {
  const [form, setForm] = useState<FamilyMember>(
    initialData || {
      relation: "",
      name: "",
      postalAddress: "",
      residentialAddress: "",
    }
  );

  // Sync initialData whenever modal reopens for edit
  useEffect(() => {
    if (initialData) setForm(initialData);
  }, [initialData]);

  if (!visible) return null;

  const handleChange = (field: keyof FamilyMember, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = () => {
    onSave(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-[var(--ford-card)] p-4 rounded w-96 text-[var(--typo)]">
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <input
          className="w-full p-2 rounded mb-2 bg-[var(--background)] text-[var(--ford-primary)]"
          placeholder="Relation"
          value={form.relation}
          onChange={(e) => handleChange("relation", e.target.value)}
        />
        <input
          className="w-full p-2 rounded mb-2 bg-[var(--background)] text-[var(--ford-primary)]"
          placeholder="Name"
          value={form.name}
          onChange={(e) => handleChange("name", e.target.value)}
        />
        <input
          className="w-full p-2 rounded mb-2 bg-[var(--background)] text-[var(--ford-primary)]"
          placeholder="Postal Address"
          value={form.postalAddress}
          onChange={(e) => handleChange("postalAddress", e.target.value)}
        />
        <input
          className="w-full p-2 rounded mb-2 bg-[var(--background)] text-[var(--ford-primary)]"
          placeholder="Residential Address"
          value={form.residentialAddress}
          onChange={(e) => handleChange("residentialAddress", e.target.value)}
        />
        <div className="flex justify-end space-x-2 mt-2">
          <button
            className="px-3 py-1 bg-[var(--ford-secondary)] rounded"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-3 py-1 bg-[var(--ford-primary)] rounded"
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// =====================
// Previous School Modal
// =====================
export function PreviousSchoolModal({
  visible,
  onClose,
  onSave,
  initialData,
  title,
}: ModalProps<PreviousSchool>) {
  const [form, setForm] = useState<PreviousSchool>(
    initialData || { name: "", location: "", startDate: "", endDate: "" }
  );

  useEffect(() => {
    if (initialData) setForm(initialData);
  }, [initialData]);

  if (!visible) return null;

  const handleChange = (field: keyof PreviousSchool, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = () => {
    onSave(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-[var(--ford-card)] p-4 rounded w-96 text-[var(--typo)]">
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <input
          className="w-full p-2 rounded mb-2 bg-[var(--background)] text-[var(--ford-primary)]"
          placeholder="School Name"
          value={form.name}
          onChange={(e) => handleChange("name", e.target.value)}
        />
        <input
          className="w-full p-2 rounded mb-2 bg-[var(--background)] text-[var(--ford-primary)]"
          placeholder="Location"
          value={form.location}
          onChange={(e) => handleChange("location", e.target.value)}
        />
        <input
          type="date"
          className="w-full p-2 rounded mb-2 bg-[var(--background)] text-[var(--ford-primary)]"
          placeholder="Start Date"
          value={form.startDate}
          onChange={(e) => handleChange("startDate", e.target.value)}
        />
        <input
          type="date"
          className="w-full p-2 rounded mb-2 bg-[var(--background)] text-[var(--ford-primary)]"
          placeholder="End Date"
          value={form.endDate}
          onChange={(e) => handleChange("endDate", e.target.value)}
        />
        <div className="flex justify-end space-x-2 mt-2">
          <button
            className="px-3 py-1 bg-[var(--ford-secondary)] rounded"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-3 py-1 bg-[var(--ford-primary)] rounded"
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
