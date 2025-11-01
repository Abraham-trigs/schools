"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import AddStudentModal from "./components/AddStudentModal.tsx";
import { useUserStore } from "@/app/store/userStore";
import { useStudentStore, StudentDetail } from "@/app/store/useStudentStore";

export default function StudentsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState("");
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  const user = useUserStore((state) => state.user);
  const router = useRouter();

  const {
    students,
    total,
    page,
    perPage,
    loading,
    error,
    fetchStudents,
    sortBy,
    sortOrder,
    setSort,
    setPage,
    setSearch,
  } = useStudentStore();

  const totalPages = Math.ceil(total / perPage);

  // Fetch students on mount
  useEffect(() => {
    fetchStudents(page, perPage);
  }, [fetchStudents]);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1); // reset to first page on new search
      setSearch(localSearch); // triggers fetchStudents internally
    }, 300);
    return () => clearTimeout(handler);
  }, [localSearch]);

  // AddStudent success callback
  const handleSuccess = () => {
    fetchStudents(page, perPage); // refresh students after adding
  };

  // Navigate to student detail page
  const handleRowClick = (student: StudentDetail) => {
    router.push(`/dashboard/students/${student.studentId}`);
  };

  // Toggle sorting for table headers
  const toggleSort = (key: "name" | "email" | "class") => {
    const order = sortBy === key && sortOrder === "asc" ? "desc" : "asc";
    setSort(key, order);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl font-semibold">Students</h1>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search students..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-ford-primary"
          />
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1 bg-ford-primary text-white px-3 py-1 rounded-md text-sm hover:bg-ford-secondary transition relative z-10"
          >
            <Plus className="w-4 h-4" /> Add Student
          </button>
        </div>
      </div>

      {/* Students Table */}
      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-ford-primary text-white">
            <tr>
              <th
                className="px-4 py-2 cursor-pointer"
                onClick={() => toggleSort("name")}
              >
                Name{" "}
                {sortBy === "name" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
              </th>
              <th
                className="px-4 py-2 cursor-pointer"
                onClick={() => toggleSort("email")}
              >
                Email{" "}
                {sortBy === "email" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
              </th>
              <th
                className="px-4 py-2 cursor-pointer"
                onClick={() => toggleSort("class")}
              >
                Class{" "}
                {sortBy === "class" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
              </th>
              <th className="px-4 py-2">Enrolled</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="text-center py-6">
                  <Loader2 className="animate-spin w-5 h-5 mx-auto text-gray-400" />
                </td>
              </tr>
            ) : students.length > 0 ? (
              students.map((s) => (
                <tr
                  key={s.studentId}
                  className="border-b hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleRowClick(s)}
                >
                  <td className="px-4 py-2">{s.name ?? "—"}</td>
                  <td className="px-4 py-2">{s.email ?? "—"}</td>
                  <td className="px-4 py-2">{s.class?.name ?? "—"}</td>
                  <td className="px-4 py-2">
                    {s.enrolledAt
                      ? new Date(s.enrolledAt).toLocaleDateString()
                      : "—"}
                  </td>
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
          onClick={() => setPage(page - 1)}
          className="px-3 py-1 rounded border disabled:opacity-50"
        >
          Prev
        </button>
        <span className="px-2 py-1">
          {page} / {totalPages}
        </span>
        <button
          disabled={page === totalPages || totalPages === 0}
          onClick={() => setPage(page + 1)}
          className="px-3 py-1 rounded border disabled:opacity-50"
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
        classId={selectedClassId ?? ""}
      />
    </div>
  );
}
