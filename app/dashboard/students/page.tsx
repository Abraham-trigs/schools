// app/dashboard/students/page.tsx
// Purpose: Students dashboard page with search, sort, pagination, and AddStudent modal

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import AddStudentModal from "./components/AddStudentModal.tsx";
import { useUserStore } from "@/app/store/useUserStore.ts";
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
    fetchStudents,
    sortBy,
    sortOrder,
    setSort,
    setPage,
    setSearch,
  } = useStudentStore();

  const totalPages = Math.ceil(total / perPage);

  useEffect(() => {
    fetchStudents(page, perPage);
  }, [fetchStudents, page, perPage]);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
      setSearch(localSearch);
    }, 300);
    return () => clearTimeout(handler);
  }, [localSearch, setPage, setSearch]);

  const handleRowClick = (student: StudentDetail) => {
    router.push(`/dashboard/students/${student.id}`);
  };

  const toggleSort = (key: "name" | "email" | "class") => {
    const sortKey = key === "class" ? "class" : key;
    const order = sortBy === sortKey && sortOrder === "asc" ? "desc" : "asc";
    setSort(sortKey as "name" | "email" | "createdAt", order);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-7">
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
              <tr key="loading">
                <td colSpan={4} className="text-center py-6">
                  <Loader2 className="animate-spin w-5 h-5 mx-auto text-gray-400" />
                </td>
              </tr>
            ) : students.length > 0 ? (
              students.map((s) => (
                <tr
                  key={s.id} // stable unique ID
                  className="border-b hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleRowClick(s)}
                >
                  <td className="px-4 py-2">{s.user?.name ?? "—"}</td>
                  <td className="px-4 py-2">{s.user?.email ?? "—"}</td>
                  <td className="px-4 py-2">{s.class?.name ?? "—"}</td>
                  <td className="px-4 py-2">
                    {s.enrolledAt
                      ? new Date(s.enrolledAt).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              ))
            ) : (
              <tr key="empty">
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

      <AddStudentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        schoolDomain={user?.schoolDomain ?? "myschool.com"}
        onSuccess={() => fetchStudents(page, perPage)}
        classId={selectedClassId ?? ""}
      />
    </div>
  );
}

/*
Design reasoning → Now correctly accesses nested `user` fields for name/email, ensuring table shows all info; keys added for all rows to satisfy React.
Structure → Exports default StudentsPage; hooks for store/router/local state; renders table, pagination, and modal.
Implementation guidance → Drop-in replacement; no backend change required; all rows have stable keys; empty/loading rows keyed.
Scalability insight → Works with additional nested relations; any new optional fields can be safely displayed without breaking React keys.
*/
