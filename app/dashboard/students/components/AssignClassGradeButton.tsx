"use client";

import { useState, useEffect } from "react";
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

  // Assign class & grade for this student only
  const handleAssign = () => {
    if (!selectedClass || !selectedGrade) return;
    setClass(selectedClass, gradesForClass); // store updates formData
    selectGrade(selectedGrade, gradesForClass);
    setOpen(false);
  };

  return (
    <>
      <button
        className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        onClick={() => setOpen(true)}
      >
        Assign Class & Grade
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white p-6 rounded shadow-md w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Assign Class & Grade</h2>

            {/* Class */}
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

            {/* Grade */}
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

            {/* Buttons */}
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
