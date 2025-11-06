"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { debounce } from "lodash";
import { useStudentStore } from "@/stores/useStudentStore";
import { useClassesStore } from "@/stores/useClassesStore";
import { useStaffStore } from "@/stores/useStaffStore";
import AddStudentModal from "./components/AddStudentModal";
import EditStudentModal from "./components/EditStudentModal";
import ConfirmDeleteModal from "./components/ConfirmDeleteModal";

export default function StudentsPage() {
  const router = useRouter();

  const [localSearch, setLocalSearch] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editModal, setEditModal] = useState<{
    open: boolean;
    studentId?: string;
  }>({ open: false });
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    studentId?: string;
  }>({ open: false });

  const {
    students,
    total,
    page,
    perPage,
    loading,
    sortBy,
    sortOrder,
    fetchStudents,
    deleteStudent,
    setSearch,
    setSort,
    setPage,
  } = useStudentStore();

  const { fetchClasses } = useClassesStore();
  const { fetchStaff } = useStaffStore();

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  useEffect(() => {
    fetchStudents(page, perPage, localSearch);
    fetchClasses();
    fetchStaff();
  }, []);

  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setSearch(query);
      setPage(1);
      fetchStudents(1, perPage, query);
    }, 400),
    [perPage]
  );

  useEffect(() => {
    debouncedSearch(localSearch);
  }, [localSearch, debouncedSearch]);

  const handleDelete = async (id: string) => {
    await deleteStudent(id);
    setDeleteModal({ open: false });
    fetchStudents(page, perPage, localSearch);
  };

  const handleRowClick = (studentId: string) => {
    router.push(`/dashboard/students/${studentId}`);
  };

  const renderRows = () => {
    if (loading) {
      return (
        <tr key="loading">
          <td colSpan={4} className="text-center py-6">
            <Loader2 className="animate-spin w-5 h-5 mx-auto text-gray-400" />
          </td>
        </tr>
      );
    }

    if (!students.length) {
      return (
        <tr key="empty">
          <td colSpan={4} className="text-center py-6 text-gray-500 italic">
            No students found
          </td>
        </tr>
      );
    }

    return students.map((student, index) => {
      const rowKey = student.id ?? `student-${index}`;
      return (
        <tr
          key={rowKey}
          className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
          onClick={() => handleRowClick(student.id!)}
        >
          <td className="px-4 py-2">{student.name ?? "—"}</td>
          <td className="px-4 py-2">{student.email ?? "—"}</td>
          <td className="px-4 py-2">{student.class?.name ?? "—"}</td>
          <td className="px-4 py-2 flex gap-2">
            <button
              className="px-2 py-1 rounded bg-blue-500 text-white text-sm hover:bg-blue-600"
              onClick={(e) => {
                e.stopPropagation();
                setEditModal({ open: true, studentId: student.id });
              }}
            >
              Edit
            </button>
            <button
              className="px-2 py-1 rounded bg-red-500 text-white text-sm hover:bg-red-600"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteModal({ open: true, studentId: student.id });
              }}
            >
              Delete
            </button>
          </td>
        </tr>
      );
    });
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
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1 bg-ford-primary text-white px-3 py-1 rounded-md text-sm hover:bg-ford-secondary transition"
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
                className="px-4 py-2 text-left cursor-pointer"
                onClick={() =>
                  setSort(
                    "name",
                    sortBy === "name" && sortOrder === "asc" ? "desc" : "asc"
                  )
                }
              >
                Name
              </th>
              <th
                className="px-4 py-2 text-left cursor-pointer"
                onClick={() =>
                  setSort(
                    "email",
                    sortBy === "email" && sortOrder === "asc" ? "desc" : "asc"
                  )
                }
              >
                Email
              </th>
              <th className="px-4 py-2 text-left">Class</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>{renderRows()}</tbody>
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

      {isAddModalOpen && (
        <AddStudentModal
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={() => fetchStudents(page, perPage, localSearch)}
        />
      )}

      {editModal.open && editModal.studentId && (
        <EditStudentModal
          studentId={editModal.studentId}
          onClose={() => setEditModal({ open: false })}
          onSuccess={() => fetchStudents(page, perPage, localSearch)}
        />
      )}

      {deleteModal.open && deleteModal.studentId && (
        <ConfirmDeleteModal
          title="Delete Student"
          message="Are you sure you want to delete this student?"
          onConfirm={() => handleDelete(deleteModal.studentId!)}
          onClose={() => setDeleteModal({ open: false })}
        />
      )}
    </div>
  );
}
