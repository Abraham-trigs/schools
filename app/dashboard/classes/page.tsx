"use client";

import { useState, useEffect } from "react";
import { useClassesStore } from "@/app/store/useClassesStore.ts";
import AddClassModal from "./components/AddClassModal";
import EditClassModal from "./components/EditClassModal";
import DeleteClassModal from "./components/DeleteClassModal";
import StudentsModal from "./components/StudentsModal";
import StudentsPerClassChart from "./components/StudentsPerClassChart";

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
  } = useClassesStore();

  // -------------------------
  // UI states
  // -------------------------
  const [localSearch, setLocalSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [studentsOpen, setStudentsOpen] = useState(false);

  // -------------------------
  // Fetch classes once on mount
  // -------------------------
  useEffect(() => {
    fetchClasses(); // fetch first page with default sort/filter/search
  }, []); // [] ensures this runs only once on mount

  // -------------------------
  // Debounced search
  // -------------------------
  useEffect(() => {
    const handler = setTimeout(() => {
      // Only trigger fetch if value actually changed
      if (localSearch !== undefined) setSearch(localSearch);
    }, 300); // 300ms debounce

    return () => clearTimeout(handler); // clean up previous timeout
  }, [localSearch, setSearch]);

  // -------------------------
  // Toggle sorting
  // -------------------------
  const toggleSort = (key: "name" | "studentCount") => {
    const order = sortBy === key && sortOrder === "asc" ? "desc" : "asc";
    setSort(key, order); // triggers fetchClasses internally
  };

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="p-6 space-y-6">
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
            onClick={() => setSearch(localSearch)} // optional manual search
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
                  <td className="px-4 py-2">{cls.students?.length ?? 0}</td>
                  <td className="px-4 py-2 flex gap-2">
                    <button
                      onClick={() => {
                        fetchClassById(cls.id);
                        setEditOpen(true);
                      }}
                      className="px-2 py-1 rounded bg-yellow-400 text-white hover:bg-yellow-500"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        fetchClassById(cls.id);
                        setDeleteOpen(true);
                      }}
                      className="px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => {
                        fetchClassById(cls.id);
                        setStudentsOpen(true);
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
          onSuccess={() => {}}
        />
      )}
      {editOpen && (
        <EditClassModal
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
          onSuccess={() => {}}
        />
      )}
      {deleteOpen && selectedClass && (
        <DeleteClassModal
          id={selectedClass.id}
          isOpen={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          onSuccess={() => {}}
        />
      )}
      {studentsOpen && selectedClass && (
        <StudentsModal
          classId={selectedClass.id}
          className={selectedClass.name}
          isOpen={studentsOpen}
          onClose={() => setStudentsOpen(false)}
          onSuccess={() => {}}
        />
      )}

      {/* Chart */}
      <StudentsPerClassChart
        data={classes.map((c) => ({
          id: c.id,
          className: c.name,
          count: c.students?.length ?? 0,
        }))}
        onBarClick={(cls) => {
          const fullClass = classes.find((c) => c.id === cls.id);
          if (!fullClass) return;
          fetchClassById(fullClass.id);
          setStudentsOpen(true);
        }}
      />
    </div>
  );
}
