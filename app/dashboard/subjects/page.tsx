// app/dashboard/subjects/page.tsx
// Purpose: Subjects management page without date filters, with search, pagination, add/edit/delete modals, fully synced to Zustand store and API. Search input focused on initial load.

"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { Loader2, Plus } from "lucide-react";
import { debounce } from "lodash";
import { useSubjectsStore, Subject } from "@/app/store/subjectStore.ts";
import AddSubjectModal from "./components/AddsubjectModal.tsx";
import EditSubjectModal from "./components/EditSubjectModal";
import ConfirmDeleteModal from "./components/ConfirmDeleteModal";

export default function SubjectsPage() {
  // ------------------------- Refs -------------------------
  const searchInputRef = useRef<HTMLInputElement>(null); // Ref to focus input on first load

  // ------------------------- Local State -------------------------
  const [localSearch, setLocalSearch] = useState(""); // Current search string
  const [isAddModalOpen, setIsAddModalOpen] = useState(false); // Add modal toggle
  const [editModal, setEditModal] = useState<{
    open: boolean;
    subjectId?: string;
  }>({ open: false }); // Edit modal state
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    subjectId?: string;
    subjectName?: string;
    subjectClasses?: { id: string; name: string }[];
  }>({ open: false }); // Delete modal state
  const [highlightId, setHighlightId] = useState<string | null>(null); // Highlight newly added/edited subject
  const [localFilters, setLocalFilters] = useState({
    classId: "",
    staffId: "",
  }); // Filter state

  // ------------------------- Store -------------------------
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
  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit)); // Compute total pages for pagination

  // ------------------------- Focus search on mount -------------------------
  useEffect(() => {
    searchInputRef.current?.focus(); // Focus the search input when component mounts
  }, []);

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
      setPage(1); // Reset to first page on search
      setSearch(query); // Update store search
      fetchSubjects({ page: 1, search: query, filters: localFilters }); // Fetch filtered subjects
    }, 400),
    [fetchSubjects, setSearch, setPage, localFilters]
  );

  useEffect(() => {
    debouncedSearch(localSearch); // Trigger debounced search whenever input changes
  }, [localSearch, debouncedSearch]);

  // ------------------------- Delete Handler -------------------------
  const handleDelete = async (id: string) => {
    const success = await deleteSubject(id); // Call store delete
    if (success) {
      setDeleteModal({ open: false }); // Close modal
      if (highlightId === id) setHighlightId(null); // Remove highlight if deleting highlighted item
    }
  };

  // ------------------------- Filter Handler -------------------------
  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...localFilters, [key]: value }; // Update local filter
    setLocalFilters(newFilters);
    setFilters(newFilters); // Update store filters
    setPage(1); // Reset page
    fetchSubjects({ page: 1, search: localSearch, filters: newFilters }); // Fetch filtered subjects
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
              e.stopPropagation(); // Prevent row click propagation
              setEditModal({ open: true, subjectId: subject.id }); // Open edit modal
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
          {/* Search Input */}
          <input
            ref={searchInputRef} // Ref used to auto-focus
            type="text"
            placeholder="Search subjects..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-ford-primary"
          />
          {/* Class Filter */}
          <select
            value={localFilters.classId}
            onChange={(e) => handleFilterChange("classId", e.target.value)}
            className="px-2 py-1 border rounded-md focus:outline-none"
          >
            <option value="">All Classes</option>
          </select>
          {/* Staff Filter */}
          <select
            value={localFilters.staffId}
            onChange={(e) => handleFilterChange("staffId", e.target.value)}
            className="px-2 py-1 border rounded-md focus:outline-none"
          >
            <option value="">All Staff</option>
          </select>
          {/* Add Subject Button */}
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
      {deleteModal.open && deleteModal.subjectId && (
        <ConfirmDeleteModal
          subjectId={deleteModal.subjectId}
          subjectName={
            subjects.find((s) => s.id === deleteModal.subjectId)?.name ||
            "Subject"
          }
          subjectClasses={
            subjects.find((s) => s.id === deleteModal.subjectId)?.classes || []
          }
          onClose={() => setDeleteModal({ open: false })}
          onSuccess={() => {
            setDeleteModal({ open: false });
            if (highlightId === deleteModal.subjectId) setHighlightId(null);
            fetchSubjects({
              page: meta.page,
              search: localSearch,
              filters: localFilters,
            });
          }}
        />
      )}
    </div>
  );
}

/*
Design reasoning → Added focus on search input for initial load to improve usability; removed date filters to simplify UX; highlights new/edited subjects; modals provide clear feedback.
Structure → SubjectsPage: main component; renderRows: table renderer; state split between modals, search, filters, highlights.
Implementation guidance → Drop into page.tsx; search auto-focus; filters limited to class/staff; modals reusable.
Scalability insight → Can add more filters or default search criteria without changing core table/pagination logic.
*/
