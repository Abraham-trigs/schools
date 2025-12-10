// app/(dashboard)/students/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import AddStudentModal from "./components/AddStudentModal";
import { useUserStore } from "@/app/store/useUserStore";
import { useStudentStore, StudentListItem } from "@/app/store/useStudentStore";
import { useClassesStore } from "@/app/store/useClassesStore";

export default function StudentsPage() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);

  const { students, loadingList, pagination, fetchStudents } =
    useStudentStore();
  const { classes, grades, fetchClasses, fetchGrades } = useClassesStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState("");

  const { page, perPage, totalPages } = pagination;

  // ------------------ Fetch classes on mount ------------------
  useEffect(() => {
    fetchClasses();
  }, []);

  // ------------------ Fetch students whenever page/perPage/search changes ------------------
  const loadStudents = useCallback(() => {
    fetchStudents(page, perPage, localSearch);
  }, [page, perPage, localSearch, fetchStudents]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  // ------------------ Debounced search ------------------
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchStudents(1, perPage, localSearch);
    }, 300);
    return () => clearTimeout(handler);
  }, [localSearch, perPage, fetchStudents]);

  // ------------------ Modal success → refresh list ------------------
  const handleSuccess = () => {
    loadStudents();
  };

  const handleRowClick = (student: StudentListItem) => {
    router.push(`/dashboard/students/${student.id}`);
  };

  // ------------------ Helper to get class / grade names ------------------
  const getClassName = (id?: string) =>
    classes.find((c) => c.id === id)?.name ?? "—";
  const getGradeName = (id?: string) =>
    grades.find((g) => g.id === id)?.name ?? "—";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-7">
        <h1 className="text-2xl font-semibold text-[var(--neutral-dark)]">
          Students
        </h1>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search students..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="px-3 py-2 border rounded-md bg-white text-[var(--neutral-dark)]
                       focus:outline-none focus:ring focus:ring-[var(--ford-primary)]"
          />

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1 bg-[var(--ford-primary)] text-white
                       px-3 py-1 rounded-md text-sm hover:bg-[var(--ford-secondary)]
                       transition"
          >
            <Plus className="w-4 h-4" /> Add Student
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded-lg shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-[var(--ford-primary)] text-[var(--typo)]">
            <tr>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Class</th>
              <th className="px-4 py-2 text-left">Grade</th>
            </tr>
          </thead>

          <tbody>
            {loadingList ? (
              <tr>
                <td colSpan={4} className="text-center py-6">
                  <Loader2 className="animate-spin w-5 h-5 mx-auto text-gray-400" />
                </td>
              </tr>
            ) : students.length > 0 ? (
              students.map((s) => (
                <tr
                  key={s.id}
                  className="border-b hover:bg-[var(--background)]/40 transition cursor-pointer"
                  onClick={() => handleRowClick(s)}
                >
                  <td className="px-4 py-2">{s.name ?? "—"}</td>
                  <td className="px-4 py-2">{s.email ?? "—"}</td>
                  <td className="px-4 py-2">{getClassName(s.classId)}</td>
                  <td className="px-4 py-2">{getGradeName(s.gradeId)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="text-center py-6 text-gray-500 italic"
                >
                  No students found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-end gap-2 mt-2">
        <button
          disabled={page === 1}
          onClick={() => fetchStudents(page - 1, perPage, localSearch)}
          className="px-3 py-1 rounded border disabled:opacity-50 bg-white"
        >
          Prev
        </button>

        <span className="px-2 py-1">
          {page} / {totalPages || 1}
        </span>

        <button
          disabled={page === totalPages || totalPages === 0}
          onClick={() => fetchStudents(page + 1, perPage, localSearch)}
          className="px-3 py-1 rounded border disabled:opacity-50 bg-white"
        >
          Next
        </button>
      </div>

      {/* Add Student Modal */}
      <AddStudentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        schoolDomain={user?.schoolDomain ?? "myschool.com"}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
