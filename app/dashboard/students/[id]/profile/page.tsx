"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useStudentStore } from "@/app/store/useStudentStore.ts";
import { useClassesStore } from "@/app/store/useClassesStore.ts";

export default function StudentProfilePage() {
  const { classId, studentId } = useParams() as {
    classId: string;
    studentId: string;
  };

  const {
    fetchStudentById,
    selectedStudent,
    loading: studentLoading,
  } = useStudentStore();
  const {
    fetchClassById,
    selectedClass,
    loading: classLoading,
  } = useClassesStore();

  useEffect(() => {
    if (classId) fetchClassById(classId);
    if (studentId) fetchStudentById(studentId);
  }, [classId, studentId, fetchClassById, fetchStudentById]);

  const loading = studentLoading || classLoading;

  if (loading || !selectedStudent) {
    return (
      <div className="flex items-center justify-center h-full text-[--typo]">
        Loading student profile...
      </div>
    );
  }

  const student = selectedStudent;
  const classInfo = selectedClass;

  return (
    <div
      className="min-h-screen px-6 py-10"
      style={{
        backgroundColor: "var(--background)",
        color: "var(--typo)",
      }}
    >
      <div
        className="max-w-4xl mx-auto rounded-2xl p-8 shadow-xl"
        style={{ backgroundColor: "var(--ford-card)" }}
      >
        {/* Header */}
        <div className="flex items-center gap-6 mb-10">
          <div
            className="w-28 h-28 rounded-full flex items-center justify-center text-4xl font-bold shadow-lg"
            style={{ backgroundColor: "var(--neutral-dark)" }}
          >
            {student.firstName[0]}
          </div>

          <div>
            <h1 className="text-3xl font-semibold">
              {student.firstName} {student.lastName}
            </h1>
            <p className="opacity-80">{student.email}</p>
            <p className="opacity-80 mt-1">
              Class: <span className="font-medium">{classInfo?.name}</span>
            </p>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Academic Summary */}
          <div
            className="rounded-xl p-6 shadow-md"
            style={{ backgroundColor: "var(--ford-secondary)" }}
          >
            <h2 className="text-xl font-semibold mb-3">Academic Summary</h2>

            <p className="mb-1">
              <span className="font-medium">Gender:</span> {student.gender}
            </p>
            <p className="mb-1">
              <span className="font-medium">DOB:</span> {student.dateOfBirth}
            </p>

            {student.grades && (
              <p className="mt-4 text-sm opacity-80">
                Grades: {student.grades.length}
              </p>
            )}
          </div>

          {/* Parent / Guardian */}
          <div
            className="rounded-xl p-6 shadow-md"
            style={{ backgroundColor: "var(--neutral-dark)" }}
          >
            <h2 className="text-xl font-semibold mb-3">Parent / Guardian</h2>
            {student.parent ? (
              <>
                <p className="mb-1">
                  <span className="font-medium">Name:</span>{" "}
                  {student.parent.name}
                </p>
                <p className="mb-1">
                  <span className="font-medium">Phone:</span>{" "}
                  {student.parent.phone}
                </p>
                <p className="mb-1">
                  <span className="font-medium">Email:</span>{" "}
                  {student.parent.email}
                </p>
              </>
            ) : (
              <p className="opacity-70">No parent record.</p>
            )}
          </div>
        </div>

        {/* Grades Section */}
        <div
          className="mt-10 rounded-xl p-6 shadow-md"
          style={{ backgroundColor: "var(--ford-primary)" }}
        >
          <h2 className="text-xl font-semibold mb-4">Grades</h2>

          {!student.grades?.length && (
            <p className="opacity-70">No grades available.</p>
          )}

          {student.grades?.map((g) => (
            <div
              key={g.id}
              className="flex justify-between py-2 border-b border-white/10"
            >
              <p>{g.subjectName}</p>
              <p>{g.score}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
