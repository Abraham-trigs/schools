"use client";

import { useState, useEffect, useRef } from "react";
import { useClassesStore } from "@/app/store/useClassesStore";
import { useAdmissionStore } from "@/app/store/admissionStore";

interface AssignClassGradeButtonProps {
  studentId: string;
  currentClassId?: string;
  currentGradeId?: string;
}

export default function AssignClassGradeButton({
  studentId,
  currentClassId,
  currentGradeId,
}: AssignClassGradeButtonProps) {
  const [open, setOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(currentClassId || "");
  const [selectedGrade, setSelectedGrade] = useState(currentGradeId || "");
  const [loading, setLoading] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);

  const {
    classes: storeClasses,
    grades: storeGrades,
    fetchClasses,
    fetchClassById,
    setSelectedClass: setStoreSelectedClass,
  } = useClassesStore();
  const { assignStudentClassGrade } = useAdmissionStore();

  // Ensure classes are loaded
  useEffect(() => {
    if (!storeClasses.length) fetchClasses();
  }, [storeClasses.length, fetchClasses]);

  // Update selected values if props change
  useEffect(() => {
    setSelectedClass(currentClassId || "");
    setSelectedGrade(currentGradeId || "");
  }, [currentClassId, currentGradeId]);

  // Fetch class with grades when class changes
  useEffect(() => {
    if (!selectedClass) return;

    fetchClassById(selectedClass).then((cls) => {
      if (!cls) return;
      const validGrade = cls.grades?.find((g) => g.id === selectedGrade);
      setSelectedGrade(validGrade?.id || "");
    });
  }, [selectedClass, selectedGrade, fetchClassById]);

  // Focus trap & Esc key
  useEffect(() => {
    if (!open || !modalRef.current) return;

    const focusableSelectors =
      'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex="0"]';
    const focusableElements = Array.from(
      modalRef.current.querySelectorAll<HTMLElement>(focusableSelectors)
    );

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      } else if (e.key === "Tab" && focusableElements.length > 0) {
        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const handleAssign = async () => {
    if (!studentId || !selectedClass || !selectedGrade) return;

    setLoading(true);
    try {
      await assignStudentClassGrade(studentId, selectedClass, selectedGrade);
      setOpen(false);
    } catch (err) {
      console.error("Failed to assign class/grade:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredGrades = storeGrades
    .filter((g) => g.classId === selectedClass)
    .map((g) => ({ ...g, label: g.name }));

  return (
    <>
      <button
        className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        onClick={() => setOpen(true)}
        disabled={loading}
      >
        Assign Class & Grade
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            ref={modalRef}
            className="bg-white p-6 rounded shadow-md w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-lg font-semibold mb-4">Assign Class & Grade</h2>

            {/* Class Select */}
            <div className="mb-4">
              <label className="block mb-1 font-medium">Class</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full border px-2 py-1 rounded"
              >
                <option value="">Select Class</option>
                {storeClasses.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Grade Select */}
            <div className="mb-4">
              <label className="block mb-1 font-medium">Grade</label>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="w-full border px-2 py-1 rounded"
                disabled={!selectedClass || filteredGrades.length === 0}
              >
                <option value="">Select Grade</option>
                {filteredGrades.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="px-3 py-1 border rounded hover:bg-gray-100"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={handleAssign}
                disabled={!selectedClass || !selectedGrade || loading}
              >
                {loading ? "Assigning..." : "Assign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
