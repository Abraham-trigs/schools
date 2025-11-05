// app/subjects/page.tsx
// Purpose: Manage Subjects with full CRUD, search, filtering, sorting, and paginated table similar to StudentsPage

"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { useSubjectStore } from "@/app/store/subjectStore";
import { useClassesStore } from "@/app/store/useClassesStore";
import { useStaffStore } from "@/app/store/useStaffStore";
import AddSubjectModal from "./components/AddsubjectModal.tsx";
import EditSubjectModal from "./components/EditSubjectModal.tsx";
import ConfirmDeleteModal from "./components/ConfirmDeleteModal.tsx";

export default function SubjectsPage() {
  const router = useRouter();
  const [localSearch, setLocalSearch] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState<{
    open: boolean;
    subjectId?: string;
  }>({ open: false });
  const [deleteModalOpen, setDeleteModalOpen] = useState<{
    open: boolean;
    subjectId?: string;
  }>({ open: false });

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

  useEffect(() => {
    fetchSubjects(page, localSearch);
    fetchClasses();
    fetchStaff();
  }, []);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
      setSearch(localSearch);
    }, 300);
    return () => clearTimeout(handler);
  }, [localSearch]);

  const toggleSort = (key: "name" | "code" | "createdBy") => {
    const order = sortBy === key && sortOrder === "asc" ? "desc" : "asc";
    setSort(key, order);
  };

  const handleDelete = async (id: string) => {
    await deleteSubject(id);
    setDeleteModalOpen({ open: false });
    fetchSubjects(page, localSearch);
  };

  const handleRowClick = (subjectId: string) => {
    router.push(`/dashboard/subjects/${subjectId}`);
  };

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
            onClick={() => setAddModalOpen(true)}
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
                        setEditModalOpen({ open: true, subjectId: subject.id });
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="px-2 py-1 rounded bg-red-500 text-white text-sm hover:bg-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteModalOpen({
                          open: true,
                          subjectId: subject.id,
                        });
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
      {addModalOpen && (
        <AddSubjectModal onClose={() => setAddModalOpen(false)} />
      )}
      {editModalOpen.open && editModalOpen.subjectId && (
        <EditSubjectModal
          subjectId={editModalOpen.subjectId}
          onClose={() => setEditModalOpen({ open: false })}
        />
      )}
      {deleteModalOpen.open && deleteModalOpen.subjectId && (
        <ConfirmDeleteModal
          title="Delete Subject"
          message="Are you sure?"
          onConfirm={() => handleDelete(deleteModalOpen.subjectId!)}
          onClose={() => setDeleteModalOpen({ open: false })}
        />
      )}
    </div>
  );
}

/*
Design reasoning → Mirrors StudentsPage UX: searchable, sortable, paginated table with loading states and actionable rows. Debounced search prevents excessive fetches. Modals handle full CRUD with optimistic refresh.

Structure →
- Exports: SubjectsPage component
- State: search, modals
- Stores: subjects, classes, staff
- Methods: fetch, sort, delete, row click, modal open/close

Implementation guidance → Plug into /dashboard/subjects, ensure useSubjectStore, useClassesStore, useStaffStore provide required methods. Wire modals with onSuccess callbacks to refresh table.

Scalability insight → Can add additional filters, advanced table columns, or inline editing without major refactor.
*/
