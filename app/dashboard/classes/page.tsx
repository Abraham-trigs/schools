// app/dashboard/classes/page.tsx
// Purpose: Classes management page with search, sorting, pagination, and fully synced modals (Add, Edit, Delete, Students)

"use client";

import { useState, useEffect } from "react";
import { useClassesStore } from "@/store/useClassesStore.ts";
import AddClassModal from "./components/AddClassModal.tsx";
import EditClassModal from "./components/EditClassModal.tsx";
import DeleteClassModal from "./components/DeleteClassModal.tsx";
import StudentsModal from "./components/StudentsModal.tsx";
import StudentsPerClassChart from "./components/StudentsPerClassChart.tsx";

export default function ClassesPage() {
  const {
    classes,
    loading,
    total,
    page,
    perPage,
    fetchClasses,
    setSort,
    sortBy,
    sortOrder,
    setSearch,
  } = useClassesStore();

  const [localSearch, setLocalSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [studentsOpen, setStudentsOpen] = useState(false);
  const [currentClass, setCurrentClass] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Fetch initial classes
  useEffect(() => {
    fetchClasses();
  }, []);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => setSearch(localSearch), 300);
    return () => clearTimeout(handler);
  }, [localSearch, setSearch]);

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
                  <td className="px-4 py-2">{cls.students?.length ?? 0}</td>
                  <td className="px-4 py-2 flex gap-2">
                    {/* Edit button */}
                    <button
                      onClick={() => {
                        setCurrentClass({ id: cls.id, name: cls.name });
                        setEditOpen(true);
                      }}
                      className="px-2 py-1 rounded bg-yellow-400 text-white hover:bg-yellow-500"
                    >
                      Edit
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => {
                        setCurrentClass({ id: cls.id, name: cls.name });
                        setDeleteOpen(true);
                      }}
                      className="px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                    >
                      Delete
                    </button>

                    {/* Students button */}
                    <button
                      onClick={() => {
                        setCurrentClass({ id: cls.id, name: cls.name }); // stores the selected class context
                        setStudentsOpen(true); // opens modal
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

      {editOpen && currentClass && (
        <EditClassModal
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
          onSuccess={() => fetchClasses()}
          classId={currentClass.id}
          className={currentClass.name}
        />
      )}

      {deleteOpen && currentClass && (
        <DeleteClassModal
          id={currentClass.id}
          className={currentClass.name} // pass the class name for the warning
          isOpen={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          onSuccess={() => fetchClasses()} // refresh after deletion
        />
      )}

      {studentsOpen && currentClass && (
        <StudentsModal
          isOpen={studentsOpen}
          onClose={() => setStudentsOpen(false)}
          classId={currentClass.id} // passes class context directly
          className={currentClass.name}
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
          setCurrentClass({ id: fullClass.id, name: fullClass.name });
          setStudentsOpen(true);
        }}
      />
    </div>
  );
}

/* 
Design reasoning:
- Minimal props passed to modals to reduce coupling and avoid unnecessary store fetches.
- Local state `currentClass` centralizes the currently selected class for all modals.
- Table actions immediately reflect current row, ensuring predictable UX and in-sync modals.

Structure:
- Main export: `ClassesPage` component.
- Local state: search, modal visibility, currentClass.
- Table and modals: full CRUD integration.
- Chart: students per class visualization.

Implementation guidance:
- Use `currentClass` to feed all modals.
- `onSuccess` triggers `fetchClasses` to refresh data.
- Sorting and search are handled via store methods.

Scalability insight:
- This pattern allows adding new modals or actions for a class without touching store selection logic; just update `currentClass` and modal props.
*/
