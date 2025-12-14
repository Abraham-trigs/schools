// app/classes/ClassesPage.tsx
// Purpose: Production-ready Classes page with table, modals, charts, pagination, search, and fully integrated CRUD with store and UX-safe modals.

"use client";

import React, { useEffect, useState } from "react";
import { useClassesStore } from "@/app/store/useClassesStore.ts";
import AddClassModal from "./components/AddClassModal";
import EditClassModal from "./components/EditClassModal";
import DeleteClassModal from "./components/DeleteClassModal";
import StudentsModal from "./components/StudentsModal";
import StudentsPerClassChart from "./components/StudentsPerClassChart";

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
            <tbody>
              {classes.map((cls) => (
                <tr key={cls.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">{cls.name}</td>
                  <td className="px-4 py-2">{cls.students?.length || 0}</td>
                  <td className="px-4 py-2 flex gap-2">
                    <button
                      onClick={async () => {
                        await fetchClassById(cls.id);
                        setEditOpen(true);
                      }}
                      className="px-2 py-1 rounded bg-yellow-400 text-white hover:bg-yellow-500"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setDeleteTargetId(cls.id); // set immediately
                        selectClass(cls); // populate store for modal
                        setDeleteOpen(true);
                      }}
                      className="px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                    >
                      Delete
                    </button>
                    <button
                      onClick={async () => {
                        setCurrentClass(cls);
                        setStudentsOpen(true);
                        await fetchClassById(cls.id);
                      }}
                      className="px-3 py-1 bg-ford-primary text-white rounded hover:bg-ford-secondary"
                    >
                      Students
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
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
          onSuccess={() => fetchClasses()}
        />
      )}
      {editOpen && selectedClass && (
        <EditClassModal
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
          onSuccess={() => fetchClasses()}
        />
      )}
      {deleteOpen && deleteTargetId && (
        <DeleteClassModal
          id={deleteTargetId}
          isOpen={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          onSuccess={() => fetchClasses()}
        />
      )}
      {studentsOpen && currentClass && (
        <StudentsModal
          classId={currentClass.id}
          className={currentClass.name}
          isOpen={studentsOpen}
          onClose={() => setStudentsOpen(false)}
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
          setCurrentClass(cls);
          setStudentsOpen(true);
          await fetchClassById(cls.id);
        }}
      />
    </div>
  );
}

/*
Design reasoning:
- Immediate assignment of deleteTargetId ensures modal renders without waiting for async fetch.
- selectClass populates store to allow modal to access full class info if needed.
- fetchClasses on onSuccess guarantees table, pagination, and total count remain consistent.

Structure:
- Header with search & Add button
- Table with sortable columns and actions
- Pagination controls
- CRUD modals and Students modal
- Chart component at bottom

Implementation guidance:
- Use store for all class state; local UI states control modals and search input.
- Async fetchClassById ensures modal has up-to-date data.
- Pagination buttons respect boundaries; search is debounced.

Scalability insight:
- Can handle hundreds of classes with pagination, search, and sorting.
- Modals are isolated, reusable, and safe for optimistic updates.
- Delete modal pattern can be extended for other entities (grades, students).
*/
