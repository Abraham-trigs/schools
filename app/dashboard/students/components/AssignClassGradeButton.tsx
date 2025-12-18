// app/students/components/AssignClassGradeButton.tsx
"use client";

import { useState, useEffect } from "react";
import { useClassesStore } from "@/app/store/useClassesStore.ts";
import { useAdmissionStore } from "@/app/store/admissionStore.ts";

interface AssignClassGradeButtonProps {
  studentId: string;
  currentClassId?: string;
  currentGradeId?: string;
  onAssigned?: () => void; // Callback to refresh page/store after assignment
}

// ------------------------------------------------------------------------
// Purpose:
// - Assign a class and grade to a student using the admission store logic.
// - Updates progress automatically without duplicating logic.
// - Calls optional onAssigned callback for immediate UI refresh.
// ------------------------------------------------------------------------
export default function AssignClassGradeButton({
  studentId,
  currentClassId,
  currentGradeId,
  onAssigned,
}: AssignClassGradeButtonProps) {
  const { classes, fetchClasses } = useClassesStore();
  const { setClass, selectGrade } = useAdmissionStore();

  // Local state per button instance
  const [selectedClass, setSelectedClass] = useState(currentClassId || "");
  const [selectedGrade, setSelectedGrade] = useState(currentGradeId || "");
  const [gradesForClass, setGradesForClass] = useState<
    { id: string; name: string; capacity: number; enrolled: number }[]
  >([]);
  const [open, setOpen] = useState(false);

  // Load classes once
  useEffect(() => {
    if (!classes.length) fetchClasses();
  }, [classes.length, fetchClasses]);

  // Update grades when class changes
  useEffect(() => {
    if (!selectedClass) {
      setGradesForClass([]);
      setSelectedGrade("");
      return;
    }
    const cls = classes.find((c) => c.id === selectedClass);
    setGradesForClass(cls?.grades || []);
    // Optionally default to first available grade
    const available = cls?.grades?.find((g) => g.enrolled < g.capacity);
    setSelectedGrade(available?.id || "");
  }, [selectedClass, classes]);

  // -------------------------
  // Assign class & grade to student
  // -------------------------
  const handleAssign = async () => {
    if (!selectedClass || !selectedGrade) return;

    // Use admission store logic to set class and grade (updates progress internally)
    setClass(selectedClass, gradesForClass);
    selectGrade(selectedGrade, gradesForClass);

    // Optional: refresh parent table/store after assignment
    if (onAssigned) await onAssigned();

    // Close modal
    setOpen(false);
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        onClick={() => setOpen(true)}
      >
        Assign Class & Grade
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white p-6 rounded shadow-md w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Assign Class & Grade</h2>

            {/* Class Selection */}
            <div className="mb-4">
              <label className="block mb-1 font-medium">Class</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full border px-2 py-1 rounded"
              >
                <option value="">Select Class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Grade Selection */}
            <div className="mb-4">
              <label className="block mb-1 font-medium">Grade</label>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="w-full border px-2 py-1 rounded"
                disabled={!selectedClass || gradesForClass.length === 0}
              >
                <option value="">Select Grade</option>
                {gradesForClass.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} (Enrolled: {g.enrolled}/{g.capacity})
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="px-3 py-1 border rounded hover:bg-gray-100"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={handleAssign}
                disabled={!selectedClass || !selectedGrade}
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------------
Design reasoning:
- Reuses existing admission store logic to maintain progress calculation consistency.
- Modal opens inline and handles its own state.
- Optional `onAssigned` prop allows parent page to refresh student table after assignment.
- Prevents assigning a class without both class and grade selected.
------------------------------------------------------------------------ */
