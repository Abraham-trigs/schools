"use client";

import { useState, useMemo } from "react";

interface ClassData {
  id: string;
  name: string;
  school: { id: string; name: string };
  students: { id: string; name: string }[];
}

interface ClassesTableProps {
  classes?: ClassData[]; // optional, default to []
  onEdit: (cls: ClassData) => void;
  onDelete: (cls: ClassData) => void;
  onViewStudents: (cls: ClassData) => void;
}

export default function ClassesTable({
  classes = [],
  onEdit,
  onDelete,
  onViewStudents,
}: ClassesTableProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<"name" | "students">("name");
  const [sortAsc, setSortAsc] = useState(true);

  // Pagination
  const [page, setPage] = useState(1);
  const perPage = 5;

  // Filtered and sorted classes
  const filteredSorted = useMemo(() => {
    return classes
      .filter((cls) =>
        cls.name.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => {
        const aVal = sortKey === "name" ? a.name : a.students.length;
        const bVal = sortKey === "name" ? b.name : b.students.length;
        if (aVal < bVal) return sortAsc ? -1 : 1;
        if (aVal > bVal) return sortAsc ? 1 : -1;
        return 0;
      });
  }, [classes, search, sortKey, sortAsc]);

  const totalPages = Math.ceil(filteredSorted.length / perPage);
  const paginated = filteredSorted.slice((page - 1) * perPage, page * perPage);

  const toggleSort = (key: "name" | "students") => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <input
        type="text"
        placeholder="Search classes..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-ford-primary w-full md:w-64"
      />

      {/* Table */}
      <table className="w-full table-auto border-collapse">
        <thead>
          <tr className="bg-ford-primary text-white">
            <th
              className="px-4 py-2 cursor-pointer"
              onClick={() => toggleSort("name")}
            >
              Name {sortKey === "name" ? (sortAsc ? "↑" : "↓") : ""}
            </th>
            <th className="px-4 py-2">School</th>
            <th
              className="px-4 py-2 cursor-pointer"
              onClick={() => toggleSort("students")}
            >
              Students {sortKey === "students" ? (sortAsc ? "↑" : "↓") : ""}
            </th>
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginated.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-2 text-center text-gray-500">
                No classes found.
              </td>
            </tr>
          ) : (
            paginated.map((cls) => (
              <tr key={cls.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2">{cls.name}</td>
                <td className="px-4 py-2">{cls.school.name}</td>
                <td className="px-4 py-2">{cls.students.length}</td>
                <td className="px-4 py-2 flex gap-2">
                  <button
                    onClick={() => onEdit(cls)}
                    className="px-2 py-1 rounded bg-yellow-400 text-white hover:bg-yellow-500"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(cls)}
                    className="px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => onViewStudents(cls)}
                    className="px-2 py-1 rounded bg-ford-secondary text-white hover:bg-ford-primary"
                  >
                    Students
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-end gap-2 mt-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1 rounded border disabled:opacity-50"
          >
            Prev
          </button>
          <span className="px-2 py-1">
            {page} / {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 rounded border disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
