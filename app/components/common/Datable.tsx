"use client";

import { useState, useMemo } from "react";

// ────────────────────────────────
// Types
// ────────────────────────────────
export type Column<T> = {
  key: keyof T | string; // allows nested access like "user.name"
  label: string;
};

type DataTableProps<T> = {
  data: T[];
  columns: Column<T>[];
  actions?: (row: T) => React.ReactNode;
  pageSize?: number;
};

// ────────────────────────────────
// Helper: safely access nested values
// ────────────────────────────────
function getValue(obj: any, path: string) {
  return path.split(".").reduce((acc, part) => acc?.[part], obj);
}

// ────────────────────────────────
// Component
// ────────────────────────────────
export default function DataTable<T extends { id: string }>({
  data,
  columns,
  actions,
  pageSize = 5,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);

  // --- Filter ---
  const filtered = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter((item) =>
      columns.some((col) => {
        const value = getValue(item, col.key as string);
        return (
          typeof value === "string" &&
          value.toLowerCase().includes(searchTerm.toLowerCase())
        );
      })
    );
  }, [data, searchTerm, columns]);

  // --- Sort ---
  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const valA = getValue(a, sortKey);
      const valB = getValue(b, sortKey);

      if (valA === valB) return 0;
      if (valA == null) return 1;
      if (valB == null) return -1;

      return valA < valB
        ? sortOrder === "asc"
          ? -1
          : 1
        : sortOrder === "asc"
        ? 1
        : -1;
    });
  }, [filtered, sortKey, sortOrder]);

  // --- Pagination ---
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));

  // ────────────────────────────────
  // Render
  // ────────────────────────────────
  return (
    <div>
      {/* Search */}
      <input
        type="text"
        placeholder="Search..."
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setCurrentPage(1);
        }}
        className="p-2 mb-4 rounded bg-secondary text-lightGray w-full sm:w-1/3 focus:outline-none focus:ring-2 focus:ring-accentPurple"
      />

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border border-muted rounded-lg">
          <thead className="bg-deeper text-lightGray">
            <tr>
              {columns.map((col, i) => (
                <th
                  key={`${String(col.key)}-${i}`}
                  className="px-4 py-2 text-left cursor-pointer select-none"
                  onClick={() => {
                    const key = col.key as string;
                    if (sortKey === key)
                      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
                    else {
                      setSortKey(key);
                      setSortOrder("asc");
                    }
                  }}
                >
                  {col.label}{" "}
                  {sortKey === col.key ? (sortOrder === "asc" ? "↑" : "↓") : ""}
                </th>
              ))}
              {actions && <th className="px-4 py-2">Actions</th>}
            </tr>
          </thead>

          <tbody className="text-lightGray">
            {paginated.map((row) => (
              <tr
                key={row.id}
                className="border-t border-muted hover:bg-deeper transition-colors"
              >
                {columns.map((col, i) => (
                  <td
                    key={`${String(col.key)}-${row.id}-${i}`}
                    className="px-4 py-2"
                  >
                    {getValue(row, col.key as string) ?? "—"}
                  </td>
                ))}
                {actions && (
                  <td className="px-4 py-2 flex space-x-2">{actions(row)}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex justify-center items-center space-x-2">
        <button
          className="px-3 py-1 bg-secondary text-lightGray rounded disabled:opacity-50"
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          Prev
        </button>
        <span className="px-2 py-1 text-lightGray">
          {currentPage} / {totalPages}
        </span>
        <button
          className="px-3 py-1 bg-secondary text-lightGray rounded disabled:opacity-50"
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}
