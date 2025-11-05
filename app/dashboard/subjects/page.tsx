// app/subjects/page.tsx
// Purpose: Subjects management page with search, sort, pagination, and modals for add/edit/delete, fully integrated with Zustand stores.

"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { useSubjectStore } from "@/app/store/subjectStore";
import { useClassesStore } from "@/app/store/useClassesStore";
import { useStaffStore } from "@/app/store/useStaffStore";
import AddSubjectModal from "./components/AddsubjectModal.tsx";
import EditSubjectModal from "./components/EditSubjectModal";
import ConfirmDeleteModal from "./components/ConfirmDeleteModal";

export default function SubjectsPage() {
  const router = useRouter();

  // ------------------------- Local state -------------------------
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
    sortBy,
    sortOrder,
    setSort,
    setPage,
    setSearch,
  } = useSubjectStore();

  const { classes, fetchClasses } = useClassesStore();
  const { staffList, fetchStaff } = useStaffStore();

  const totalPages = Math.ceil(total / limit);

  // ------------------------- Effects -------------------------
  // Initial fetch
  useEffect(() => {
    fetchSubjects(page, localSearch);
    fetchClasses();
    fetchStaff();
  }, []);

  // Sync local search to store
  useEffect(() => {
    setSearch(localSearch);
  }, [localSearch]);

  // ------------------------- Handlers -------------------------
  const toggleSort = (key: "name" | "code" | "createdBy") => {
    const order = sortBy === key && sortOrder === "asc" ? "desc" : "asc";
    setSort(key, order);
  };

  const handleDelete = async (id: string) => {
    await deleteSubject(id);
    setDeleteModal({ open: false, subjectId: undefined });
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
            className="flex items-center gap-1 bg-ford-primary text-white px-3 py-1 rounded-md text-sm hover:bg-ford-secondary transition relative z-10"
          >
            <Plus className="w-4 h-4" /> Add Subject
          </button>
        </div>
      </div>

      {/* Subjects Table */}
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
                onClick={() => toggleSort("code")}
              >
                Code{" "}
                {sortBy === "code" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
              </th>
              <th
                className="px-4 py-2 cursor-pointer"
                onClick={() => toggleSort("createdBy")}
              >
                Created By{" "}
                {sortBy === "createdBy"
                  ? sortOrder === "asc"
                    ? "↑"
                    : "↓"
                  : ""}
              </th>
              <th className="px-4 py-2">Actions</th>
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
                  className="border-b hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleRowClick(subject.id)}
                >
                  <td className="px-4 py-2">{subject.name ?? "—"}</td>
                  <td className="px-4 py-2">{subject.code ?? "—"}</td>
                  <td className="px-4 py-2">
                    {subject.createdBy?.name ?? "—"} (
                    {subject.createdBy?.role ?? "—"})
                  </td>
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
          isOpen={editModal.open}
          subjectId={editModal.subjectId ?? ""}
          onClose={() => setEditModal({ open: false, subjectId: undefined })}
          onSuccess={() => {
            setEditModal({ open: false, subjectId: undefined });
            fetchSubjects(page, localSearch); // ✅ refresh data after edit
          }}
        />
      )}

      {deleteModal.open && deleteModal.subjectId && (
        <ConfirmDeleteModal
          title="Delete Subject"
          message="Are you sure?"
          onConfirm={() => handleDelete(deleteModal.subjectId!)}
          onClose={() => setDeleteModal({ open: false, subjectId: undefined })}
        />
      )}
    </div>
  );
}

/* Design reasoning:
- Central page for managing subjects with clear actions for add/edit/delete.
- Search, sort, and pagination integrated with Zustand for consistent state and minimal re-renders.
- Modals for CRUD actions ensure UX consistency and avoid page navigation.

Structure:
- Header with search and add button.
- Table showing subjects with clickable rows and actions.
- Pagination controls and modals for add/edit/delete.

Implementation guidance:
- Ensure fetchSubjects, fetchClasses, fetchStaff are called on mount to populate state.
- Modal callbacks trigger fetchSubjects to refresh data.

Scalability insight:
- Can extend table to include more relational fields (assigned staff/classes) without modifying main layout.
*/
