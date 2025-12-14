// app/subjects/page.tsx
// Purpose: Subjects management page integrated with Zustand store, supporting search, pagination, and CRUD modals.

"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSubjectStore } from "@/app/store/subjectStore";
import { useClassesStore } from "@/app/store/useClassesStore";
import { useStaffStore } from "@/app/store/useStaffStore";
import AddSubjectModal from "./components/AddsubjectModal.tsx";
import EditSubjectModal from "./components/EditSubjectModal.tsx";
import ConfirmDeleteModal from "./components/ConfirmDeleteModal.tsx";

export default function SubjectsPage() {
  const router = useRouter();

  // ------------------------- Local UI state -------------------------
  const [localSearch, setLocalSearch] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editModal, setEditModal] = useState<{
    open: boolean;
    subjectId?: string;
  }>({ open: false });
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    subjectId?: string;
  }>({ open: false });

  // ------------------------- Zustand stores -------------------------
  const {
    subjects,
    total,
    page,
    limit,
    loading,
    error,
    fetchSubjects,
    deleteSubject,
    setPage,
    setSearch,
  } = useSubjectStore();

  const { fetchClasses } = useClassesStore();
  const { fetchStaff } = useStaffStore();

  const totalPages = Math.max(1, Math.ceil(total / limit));

  // ------------------------- Effects -------------------------
  useEffect(() => {
    fetchSubjects(page, localSearch);
    fetchClasses();
    fetchStaff();
  }, []);

  useEffect(() => {
    setSearch(localSearch);
  }, [localSearch]);

  // ------------------------- Handlers -------------------------
  const handleDelete = async (id: string) => {
    await deleteSubject(id);
    setDeleteModal({ open: false });
    fetchSubjects(page, localSearch);
  };

  const handleRowClick = (subjectId: string) => {
    router.push(`/dashboard/subjects/${subjectId}`);
  };

  // ------------------------- Render -------------------------
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-7">
        <h1 className="text-2xl font-semibold">Subjects</h1>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search subjects..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-ford-primary"
          />
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1 bg-ford-primary text-white px-3 py-1 rounded-md text-sm hover:bg-ford-secondary transition"
          >
            <Plus className="w-4 h-4" /> Add Subject
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-ford-primary text-white">
            <tr>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Code</th>
              <th className="px-4 py-2 text-left">Description</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="text-center py-6">
                  <Loader2 className="animate-spin w-5 h-5 mx-auto text-gray-400" />
                </td>
              </tr>
            ) : subjects.length > 0 ? (
              subjects.map((subject) => (
                <tr
                  key={subject.id}
                  className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleRowClick(subject.id)}
                >
                  <td className="px-4 py-2">{subject.name ?? "—"}</td>
                  <td className="px-4 py-2">{subject.code ?? "—"}</td>
                  <td className="px-4 py-2">{subject.description ?? "—"}</td>
                  <td className="px-4 py-2 flex gap-2">
                    <button
                      className="px-2 py-1 rounded bg-blue-500 text-white text-sm hover:bg-blue-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditModal({ open: true, subjectId: subject.id });
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="px-2 py-1 rounded bg-red-500 text-white text-sm hover:bg-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteModal({ open: true, subjectId: subject.id });
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="text-center py-6 text-gray-500 italic"
                >
                  No subjects found
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

      {/* Modals */}
      {isAddModalOpen && (
        <AddSubjectModal
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={() => {
            setIsAddModalOpen(false);
            fetchSubjects();
          }}
        />
      )}

      {editModal.open && editModal.subjectId && (
        <EditSubjectModal
          subjectId={editModal.subjectId}
          onClose={() => setEditModal({ open: false })}
          onSuccess={() => {
            setEditModal({ open: false });
            fetchSubjects(page, localSearch);
          }}
        />
      )}

      {deleteModal.open && deleteModal.subjectId && (
        <ConfirmDeleteModal
          title="Delete Subject"
          message="Are you sure you want to delete this subject?"
          onConfirm={() => handleDelete(deleteModal.subjectId!)}
          onClose={() => setDeleteModal({ open: false })}
        />
      )}
    </div>
  );
}

/*
Design reasoning:
- Removed sort logic to match current Zustand store design (search + pagination only).
- Keeps UI responsive and clear, with optimistic modal closure on success.
- Maintains clean separation: state logic (store) vs. view logic (component).

Structure:
- State: local search, modal open/close.
- Data: from useSubjectStore with pagination.
- Actions: create, update, delete handled via modal callbacks.

Implementation guidance:
- Fetch and update subjects through store only.
- Extend table columns as schema grows (e.g., staff assignments).

Scalability insight:
- Adding filters (e.g., by class or staff) requires no core layout change.
- Easily replaced by a reusable <PaginatedTable> component for future entities.
*/
