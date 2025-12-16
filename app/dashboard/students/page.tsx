// app/students/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import AssignClassGradeButton from "./components/AssignClassGradeButton";
import { useStudentStore, StudentListItem } from "@/app/store/useStudentStore";
import { useClassesStore } from "@/app/store/useClassesStore";
import AdmissionFormModal from "./components/AdmissionFormModal";

export default function StudentsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const {
    students,
    loading,
    errors,
    pagination,
    filters,
    fetchStudents,
    fetchStudentDetail,
    fetchStudentAdmission,
    setFilters,
  } = useStudentStore();

  const { classes, fetchClasses } = useClassesStore();

  // ------------------ Load Students ------------------
  const loadStudents = useCallback(() => {
    fetchStudents({
      page: filters.page,
      search: filters.search,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      classId: filters.classId,
      gradeId: filters.gradeId,
    });
  }, [
    fetchStudents,
    filters.page,
    filters.search,
    filters.sortBy,
    filters.sortOrder,
    filters.classId,
    filters.gradeId,
  ]);

  useEffect(() => {
    loadStudents();
    fetchClasses();
  }, [loadStudents, fetchClasses]);

  // ------------------ Search ------------------
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    setFilters({ search: value, page: 1 });
  };

  // ------------------ Row Click ------------------
  const handleRowClick = async (student: StudentListItem) => {
    await fetchStudentDetail(student.id);
    if (student.admissionId) await fetchStudentAdmission(student.admissionId);
    router.push(`/students/${student.id}`);
  };

  // ------------------ Sorting ------------------
  const handleSort = (key: keyof StudentListItem) => {
    const sortOrder =
      filters.sortBy === key && filters.sortOrder === "asc" ? "desc" : "asc";
    setFilters({ sortBy: key, sortOrder, page: 1 });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  if (Object.keys(errors).length > 0) {
    return (
      <div className="text-red-600 p-4">
        {Object.values(errors)
          .flat()
          .map((err, idx) => (
            <p key={idx}>{err}</p>
          ))}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 mt-7">
      {/* Header + Admission Modal */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Students</h1>
        {/* Pass loadStudents so modal triggers refresh on close */}
        <AdmissionFormModal onStudentAdded={loadStudents} />
      </div>

      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="Search students..."
          value={search}
          onChange={handleSearch}
          className="border px-3 py-2 rounded w-full sm:w-64"
        />
      </div>

      {/* Reflective Header for Class & Grade */}
      <div className="flex justify-between items-center mt-4 mb-2 px-2">
        <span className="font-medium">Class & Grade Assignment</span>
      </div>

      {/* Students Table */}
      <table className="min-w-full border-collapse border border-gray-200">
        <thead>
          <tr>
            {["name", "email"].map((key) => (
              <th
                key={key}
                className="border px-4 py-2 cursor-pointer"
                onClick={() => handleSort(key as keyof StudentListItem)}
              >
                {key.charAt(0).toUpperCase() + key.slice(1)}
                {filters.sortBy === key
                  ? filters.sortOrder === "asc"
                    ? " ▲"
                    : " ▼"
                  : ""}
              </th>
            ))}
            <th className="border px-4 py-2">Assign Class & Grade</th>
          </tr>
        </thead>

        <tbody>
          {students.length === 0 && (
            <tr>
              <td colSpan={3} className="border px-4 py-2 text-center">
                No students found.
              </td>
            </tr>
          )}

          {students.map((s) => (
            <tr key={s.id} className="cursor-pointer hover:bg-gray-50">
              <td
                className="border px-4 py-2"
                onClick={() => handleRowClick(s)}
              >
                {s.name ?? "Unknown"}
              </td>
              <td
                className="border px-4 py-2"
                onClick={() => handleRowClick(s)}
              >
                {s.email ?? "-"}
              </td>
              <td className="border px-4 py-2">
                <AssignClassGradeButton
                  studentId={s.id}
                  currentClassId={s.classId}
                  currentGradeId={s.gradeId}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {Array.from({ length: pagination.totalPages }, (_, i) => (
            <button
              key={i}
              className={`px-3 py-1 border rounded ${
                pagination.page === i + 1
                  ? "bg-blue-500 text-white"
                  : "bg-white"
              }`}
              onClick={() => setFilters({ page: i + 1 })}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
