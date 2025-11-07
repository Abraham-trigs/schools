// app/dashboard/subjects/page.tsx
// Purpose: Subjects management page with search, filters, pagination, add/edit/delete modals, fully synced to Zustand store and API

"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Loader2, Plus } from "lucide-react";
import { debounce } from "lodash";
import { useSubjectsStore, Subject } from "@/app/store/subjectStore.ts";
import AddSubjectModal from "./components/AddsubjectModal.tsx";
import EditSubjectModal from "./components/EditSubjectModal";
import ConfirmDeleteModal from "./components/ConfirmDeleteModal";

export default function SubjectsPage() {
  const [localSearch, setLocalSearch] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editModal, setEditModal] = useState<{
    open: boolean;
    subjectId?: string;
  }>({ open: false });
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    subjectId?: string;
    subjectName?: string;
    subjectClasses?: { id: string; name: string }[];
  }>({ open: false });
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [localFilters, setLocalFilters] = useState({
    classId: "",
    staffId: "",
    fromDate: "",
    toDate: "",
  });

  const {
    subjects,
    meta,
    loadingFetch,
    fetchSubjects,
    deleteSubject,
    setSearch,
    setPage,
    setFilters,
  } = useSubjectsStore();

  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit));

  // ------------------------- Fetch Subjects -------------------------
  useEffect(() => {
    fetchSubjects({
      page: meta.page,
      search: localSearch,
      filters: localFilters,
    });
  }, [meta.page, localSearch, localFilters, fetchSubjects]);

  // ------------------------- Debounced Search -------------------------
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setPage(1);
      setSearch(query);
      fetchSubjects({ page: 1, search: query, filters: localFilters });
    }, 400),
    [fetchSubjects, setSearch, setPage, localFilters]
  );

  useEffect(() => {
    debouncedSearch(localSearch);
  }, [localSearch, debouncedSearch]);

  // ------------------------- Handle Delete -------------------------
  const handleDelete = async (id: string) => {
    const success = await deleteSubject(id);
    if (success) {
      setDeleteModal({ open: false });
      if (highlightId === id) setHighlightId(null);
    }
  };

  // ------------------------- Handle Filter Change -------------------------
  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    setFilters(newFilters);
    setPage(1);
    fetchSubjects({ page: 1, search: localSearch, filters: newFilters });
  };

  // ------------------------- Render Table Rows -------------------------
  const renderRows = () => {
    if (loadingFetch) {
      return (
        <tr key="loading">
          <td colSpan={6} className="text-center py-6">
            <Loader2 className="animate-spin w-5 h-5 mx-auto text-gray-400" />
          </td>
        </tr>
      );
    }

    if (!subjects.length) {
      return (
        <tr key="empty">
          <td colSpan={6} className="text-center py-6 text-gray-500 italic">
            No subjects found
          </td>
        </tr>
      );
    }

    return subjects.map((subject: Subject) => (
      <tr
        key={subject.id}
        className={`border-b hover:bg-gray-50 transition-colors ${
          subject.id === highlightId ? "bg-green-100" : ""
        }`}
      >
        <td className="px-4 py-2">{subject.name}</td>
        <td className="px-4 py-2">{subject.code ?? "—"}</td>
        <td className="px-4 py-2">{subject.description ?? "—"}</td>
        <td className="px-4 py-2">{subject.createdBy?.name ?? "—"}</td>
        <td className="px-4 py-2">{subject.createdAt?.slice(0, 10) ?? "—"}</td>
        <td className="px-4 py-2 flex gap-2">
          <button
            type="button"
            className="px-2 py-1 rounded bg-blue-500 text-white text-sm hover:bg-blue-600"
            onClick={(e) => {
              e.stopPropagation();
              setEditModal({ open: true, subjectId: subject.id });
            }}
          >
            Edit
          </button>
          <button
            type="button"
            className="px-2 py-1 rounded bg-red-500 text-white text-sm hover:bg-red-600"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteModal({
                open: true,
                subjectId: subject.id,
                subjectName: subject.name,
                subjectClasses: subject.classes,
              });
            }}
          >
            Delete
          </button>
        </td>
      </tr>
    ));
  };

  // ------------------------- Render -------------------------
  return (
    <div className="p-6 space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-7">
        <h1 className="text-2xl font-semibold">Subjects</h1>
        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Search subjects..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-ford-primary"
          />
          <select
            value={localFilters.classId}
            onChange={(e) => handleFilterChange("classId", e.target.value)}
            className="px-2 py-1 border rounded-md focus:outline-none"
          >
            <option value="">All Classes</option>
            {/* Populate dynamically if needed */}
          </select>
          <select
            value={localFilters.staffId}
            onChange={(e) => handleFilterChange("staffId", e.target.value)}
            className="px-2 py-1 border rounded-md focus:outline-none"
          >
            <option value="">All Staff</option>
            {/* Populate dynamically if needed */}
          </select>
          <input
            type="date"
            value={localFilters.fromDate}
            onChange={(e) => handleFilterChange("fromDate", e.target.value)}
            className="px-2 py-1 border rounded-md focus:outline-none"
          />
          <input
            type="date"
            value={localFilters.toDate}
            onChange={(e) => handleFilterChange("toDate", e.target.value)}
            className="px-2 py-1 border rounded-md focus:outline-none"
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
              <th className="px-4 py-2 text-left">Created By</th>
              <th className="px-4 py-2 text-left">Created At</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>{renderRows()}</tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-end gap-2 mt-2">
        <button
          disabled={meta.page === 1}
          onClick={() => setPage(meta.page - 1)}
          className="px-3 py-1 rounded border disabled:opacity-50"
        >
          Prev
        </button>
        <span className="px-2 py-1">
          {meta.page} / {totalPages}
        </span>
        <button
          disabled={meta.page === totalPages || totalPages === 0}
          onClick={() => setPage(meta.page + 1)}
          className="px-3 py-1 rounded border disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {/* Modals */}
      {isAddModalOpen && (
        <AddSubjectModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={(newSubject: Subject) => {
            setHighlightId(newSubject.id);
            setPage(1);
          }}
        />
      )}

      {editModal.open && editModal.subjectId && (
        <EditSubjectModal
          isOpen={editModal.open}
          subjectId={editModal.subjectId}
          onClose={() => setEditModal({ open: false })}
          onSuccess={() =>
            fetchSubjects({
              page: meta.page,
              search: localSearch,
              filters: localFilters,
            })
          }
        />
      )}

      {deleteModal.open && deleteModal.subjectId && deleteModal.subjectName && (
        <ConfirmDeleteModal
          subjectId={deleteModal.subjectId}
          subjectName={deleteModal.subjectName}
          subjectClasses={deleteModal.subjectClasses}
          onClose={() => setDeleteModal({ open: false })}
          onSuccess={() =>
            fetchSubjects({
              page: meta.page,
              search: localSearch,
              filters: localFilters,
            })
          }
        />
      )}
    </div>
  );
}
