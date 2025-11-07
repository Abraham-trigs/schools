// app/dashboard/subjects/page.tsx
// Purpose: Subjects management page with search, filters, pagination, add/edit/delete modals, fully synced without infinite fetch loop.

"use client";

import React, { useEffect, useState, useRef } from "react";
import { Loader2, Plus } from "lucide-react";
import { useSubjectsStore, Subject } from "@/app/store/subjectStore";
import { useClassesStore } from "@/app/store/useClassesStore";
import { useStaffStore } from "@/app/store/useStaffStore";
import AddSubjectModal from "./components/AddsubjectModal";
import EditSubjectModal from "./components/EditSubjectModal";
import ConfirmDeleteModal from "./components/ConfirmDeleteModal";
import { debounce } from "lodash";

export default function SubjectsPage() {
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [localSearch, setLocalSearch] = useState("");
  const [localFilters, setLocalFilters] = useState({
    classId: "",
    staffId: "",
  });
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editModal, setEditModal] = useState<{
    open: boolean;
    subjectId?: string;
  }>({ open: false });
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    subjectId?: string;
    subjectName?: string;
  }>({ open: false });

  const subjectsStore = useSubjectsStore();
  const classesStore = useClassesStore();
  const staffStore = useStaffStore();

  const { subjects, meta, loadingFetch, deleteSubject, setSearch, setPage } =
    subjectsStore;
  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit));

  // ---------------- Focus input ----------------
  useEffect(() => searchInputRef.current?.focus(), []);

  // ---------------- Fetch dropdowns once ----------------
  useEffect(() => {
    if (!classesStore.classes.length) classesStore.fetchClasses();
    if (!staffStore.staffList.length) staffStore.fetchStaff();
  }, []);

  // ---------------- Debounced Search ----------------
  const debouncedSearch = debounce((query: string) => {
    setPage(1);
    setSearch(query);
    subjectsStore.fetchSubjects({
      page: 1,
      search: query,
      filters: localFilters,
    });
  }, 400);

  useEffect(() => {
    debouncedSearch(localSearch);
  }, [localSearch]);

  // ---------------- Filter / Pagination ----------------
  const handleFilterChange = (key: "classId" | "staffId", value: string) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    setPage(1);
    subjectsStore.fetchSubjects({
      page: 1,
      search: localSearch,
      filters: newFilters,
    });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    subjectsStore.fetchSubjects({
      page: newPage,
      search: localSearch,
      filters: localFilters,
    });
  };

  // ---------------- Delete Handler ----------------
  const handleDelete = async (id: string) => {
    const success = await deleteSubject(id);
    if (success) {
      setDeleteModal({ open: false });
      if (highlightId === id) setHighlightId(null);
    }
  };

  // ---------------- Table Rows ----------------
  const renderRows = () => {
    if (loadingFetch)
      return (
        <tr key="loading">
          <td colSpan={6} className="text-center py-6">
            <Loader2 className="animate-spin w-5 h-5 mx-auto text-gray-400" />
          </td>
        </tr>
      );
    if (!subjects.length)
      return (
        <tr key="empty">
          <td colSpan={6} className="text-center py-6 text-gray-500 italic">
            No subjects found
          </td>
        </tr>
      );

    return subjects.map((s: Subject) => (
      <tr
        key={s.id}
        className={`border-b hover:bg-gray-50 transition-colors ${
          s.id === highlightId ? "bg-green-100" : ""
        }`}
      >
        <td className="px-4 py-2">{s.name}</td>
        <td className="px-4 py-2">{s.code ?? "—"}</td>
        <td className="px-4 py-2">{s.description ?? "—"}</td>
        <td className="px-4 py-2">{s.createdBy?.name ?? "—"}</td>
        <td className="px-4 py-2">{s.createdAt?.slice(0, 10) ?? "—"}</td>
        <td className="px-4 py-2 flex gap-2">
          <button
            type="button"
            className="px-2 py-1 rounded bg-blue-500 text-white text-sm hover:bg-blue-600"
            onClick={(e) => {
              e.stopPropagation();
              setEditModal({ open: true, subjectId: s.id });
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
                subjectId: s.id,
                subjectName: s.name,
              });
            }}
          >
            Delete
          </button>
        </td>
      </tr>
    ));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-7">
        <h1 className="text-2xl font-semibold">Subjects</h1>
        <div className="flex gap-2 flex-wrap">
          <input
            ref={searchInputRef}
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
            {classesStore.classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={localFilters.staffId}
            onChange={(e) => handleFilterChange("staffId", e.target.value)}
            className="px-2 py-1 border rounded-md focus:outline-none"
          >
            <option value="">All Staff</option>
            {staffStore.staffList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1 bg-ford-primary text-white px-3 py-1 rounded-md text-sm hover:bg-ford-secondary transition"
          >
            <Plus className="w-4 h-4" /> Add Subject
          </button>
        </div>
      </div>

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

      <div className="flex justify-end gap-2 mt-2">
        <button
          disabled={meta.page === 1}
          onClick={() => handlePageChange(meta.page - 1)}
          className="px-3 py-1 rounded border disabled:opacity-50"
        >
          Prev
        </button>
        <span className="px-2 py-1">
          {meta.page} / {totalPages}
        </span>
        <button
          disabled={meta.page === totalPages}
          onClick={() => handlePageChange(meta.page + 1)}
          className="px-3 py-1 rounded border disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {isAddModalOpen && (
        <AddSubjectModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={(newSub) => {
            setHighlightId(newSub.id);
            handlePageChange(1);
          }}
        />
      )}
      {editModal.open && editModal.subjectId && (
        <EditSubjectModal
          isOpen={editModal.open}
          subjectId={editModal.subjectId}
          onClose={() => setEditModal({ open: false })}
          onSuccess={() =>
            subjectsStore.fetchSubjects({
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
          onClose={() => setDeleteModal({ open: false })}
          onSuccess={() => handleDelete(deleteModal.subjectId!)}
        />
      )}
    </div>
  );
}

/*
Design reasoning:
- Fully decoupled fetch triggers prevent infinite loop.
- Search, filters, pagination explicitly call fetchSubjects.
- Dropdown fetch occurs only once on mount.
- Debounce prevents rapid API calls and preserves UX.

Structure:
- SubjectsPage component manages localSearch, localFilters, highlightId, modals.
- Table rows, pagination, and modals fully encapsulated.
- Fetch logic explicitly tied to user actions.

Implementation guidance:
- Ensure Zustand stores have memoized fetchSubjects.
- Avoid passing store functions directly to useEffect dependencies.
- Debounced search triggers only when user types.

Scalability insight:
- Additional filters or sorts can be added without risk of loops by using the same explicit trigger pattern.
*/
