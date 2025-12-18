// app/classes/ClassesPage.tsx
// Purpose: Production-ready Classes page with table, modals, charts, pagination, search, and fully integrated CRUD with store and UX-safe modals.

"use client";

import React, { useEffect, useState } from "react";
import { useClassesStore } from "@/app/store/useClassesStore.ts";
import AddClassModal from "./components/AddClassModal.tsx";
import EditClassModal from "./components/EditClassModal.tsx";
import DeleteClassModal from "./components/DeleteClassModal.tsx";
import StudentsModal from "./components/StudentsModal.tsx";
import StudentsPerClassChart from "./components/StudentsPerClassChart.tsx";
import SkuunAiChat from "../SkuunAi/components/SkuunAiChat.tsx";

// -------------------------
// Types
// -------------------------
interface ClassTableRow {
  id: string;
  name: string;
  students?: any[];
}

// -------------------------
// Component
// -------------------------
export default function ClassesPage() {
  const {
    classes,
    loading,
    total,
    page,
    perPage,
    fetchClasses,
    selectedClass,
    setSort,
    sortBy,
    sortOrder,
    setSearch,
    fetchClassById,
    selectClass,
    clearSelectedClass,
  } = useClassesStore();

  // -------------------------
  // Local UI States
  // -------------------------
  const [localSearch, setLocalSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [studentsOpen, setStudentsOpen] = useState(false);
  const [currentClass, setCurrentClass] = useState<ClassTableRow | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // -------------------------
  // Fetch initial data on mount
  // -------------------------
  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  // -------------------------
  // Debounced search
  // -------------------------
  useEffect(() => {
    const handler = setTimeout(() => setSearch(localSearch), 300);
    return () => clearTimeout(handler);
  }, [localSearch, setSearch]);

  // -------------------------
  // Toggle sorting
  // -------------------------
  const toggleSort = (key: "name" | "studentCount") => {
    const order = sortBy === key && sortOrder === "asc" ? "desc" : "asc";
    setSort(key, order);
  };

  const totalPages = Math.ceil(total / perPage);

  // -------------------------
  // Modal handlers
  // -------------------------
  const openEditModal = async (cls: ClassTableRow) => {
    selectClass(cls); // populate store immediately
    setEditOpen(true); // open modal
    await fetchClassById(cls.id); // refresh relational data for modal
  };

  const openDeleteModal = (cls: ClassTableRow) => {
    setDeleteTargetId(cls.id);
    selectClass(cls);
    setDeleteOpen(true);
  };

  const openStudentsModal = async (cls: ClassTableRow) => {
    selectClass(cls);
    setCurrentClass(cls);
    setStudentsOpen(true);
    await fetchClassById(cls.id);
  };

  // -------------------------
  // Table row render
  // -------------------------
  const renderRows = () =>
    classes.map((cls) => (
      <tr key={cls.id} className="border-b hover:bg-gray-50">
        <td className="px-4 py-2">{cls.name}</td>
        <td className="px-4 py-2">{cls.students?.length || 0}</td>
        <td className="px-4 py-2 flex gap-2">
          <button
            onClick={() => openEditModal(cls)}
            className="px-2 py-1 rounded bg-yellow-400 text-white hover:bg-yellow-500"
          >
            Edit
          </button>
          <button
            onClick={() => openDeleteModal(cls)}
            className="px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700"
          >
            Delete
          </button>
          <button
            onClick={() => openStudentsModal(cls)}
            className="px-3 py-1 bg-ford-primary text-white rounded hover:bg-ford-secondary"
          >
            Students
          </button>
        </td>
      </tr>
    ));

  return (
    <div className="p-6 space-y-6 mt-7">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl font-bold">Classes</h1>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search classes..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-ford-primary"
          />
          <button
            onClick={() => setSearch(localSearch)}
            className="px-4 py-2 rounded bg-ford-primary text-white hover:bg-ford-secondary"
          >
            Search
          </button>
          <button
            onClick={() => setAddOpen(true)}
            className="px-4 py-2 rounded bg-ford-primary text-white hover:bg-ford-secondary"
          >
            Add Class
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <p>Loading classes...</p>
      ) : (
        <>
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="bg-ford-primary text-white">
                <th
                  className="px-4 py-2 cursor-pointer"
                  onClick={() => toggleSort("name")}
                >
                  Name{" "}
                  {sortBy === "name" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
                </th>
                <th
                  className="px-4 py-2 cursor-pointer"
                  onClick={() => toggleSort("studentCount")}
                >
                  Students{" "}
                  {sortBy === "studentCount"
                    ? sortOrder === "asc"
                      ? "↑"
                      : "↓"
                    : ""}
                </th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>{renderRows()}</tbody>
          </table>

          {/* Pagination */}
          <div className="flex justify-end gap-2 mt-2">
            <button
              disabled={page === 1}
              onClick={() => fetchClasses(page - 1)}
              className="px-3 py-1 rounded border disabled:opacity-50"
            >
              Prev
            </button>
            <span className="px-2 py-1">
              {page} / {totalPages}
            </span>
            <button
              disabled={page === totalPages || totalPages === 0}
              onClick={() => fetchClasses(page + 1)}
              className="px-3 py-1 rounded border disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}

      {/* Modals */}
      {addOpen && (
        <AddClassModal
          isOpen={addOpen}
          onClose={() => setAddOpen(false)}
          onSuccess={() => fetchClasses(page)}
        />
      )}
      {editOpen && selectedClass && (
        <EditClassModal
          isOpen={editOpen}
          onClose={() => {
            setEditOpen(false);
            clearSelectedClass?.();
          }}
          onSuccess={() => fetchClasses(page)}
        />
      )}
      {deleteOpen && deleteTargetId && selectedClass && (
        <DeleteClassModal
          id={deleteTargetId}
          isOpen={deleteOpen}
          onClose={() => {
            setDeleteOpen(false);
            clearSelectedClass?.();
            setDeleteTargetId(null);
          }}
          onSuccess={() => fetchClasses(page)}
        />
      )}
      {studentsOpen && currentClass && selectedClass && (
        <StudentsModal
          classId={currentClass.id}
          className={currentClass.name}
          isOpen={studentsOpen}
          onClose={() => {
            setStudentsOpen(false);
            clearSelectedClass?.();
            setCurrentClass(null);
          }}
        />
      )}

      {/* Chart */}
      <StudentsPerClassChart
        data={classes.map((c) => ({
          id: c.id,
          className: c.name,
          count: c.students?.length || 0,
        }))}
        onBarClick={async (cls) => {
          selectClass(cls);
          setCurrentClass(cls);
          setStudentsOpen(true);
          await fetchClassById(cls.id);
        }}
      />
    </div>
  );
}
