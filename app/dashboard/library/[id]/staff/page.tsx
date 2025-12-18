// app/(library)/staff/page.tsx
"use client";
import { useEffect } from "react";
import { useLibraryStaffStore } from "@/app/store/useLibraryStaffStore.ts";
import LibraryStaffModal from "../staff/components/LibraryStaffModal.tsx";

export default function LibraryStaffPage() {
  const {
    staffList,
    fetchStaff,
    page,
    setPage,
    totalPages,
    search,
    setSearch,
    selectedStaff,
    setSelectedStaff,
    loading,
  } = useLibraryStaffStore();

  useEffect(() => {
    fetchStaff();
  }, []);

  return (
    <div className="p-4">
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search staff..."
        className="border p-2 rounded w-full mb-4"
      />
      <button onClick={() => setSelectedStaff({} as any)}>+ Add Staff</button>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {staffList.map((s) => (
          <div key={s.id} className="p-2 border rounded">
            <h3>{s.user.name}</h3>
            <p>{s.user.email}</p>
            <p>Position: {s.position}</p>
            <p>Department: {s.department?.name}</p>
            <button onClick={() => setSelectedStaff(s)}>Edit</button>
          </div>
        ))}
      </div>
      <LibraryStaffModal
        staff={selectedStaff}
        onClose={() => setSelectedStaff(null)}
      />
      <div className="mt-4 flex justify-between">
        <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
          Prev
        </button>
        <span>
          {page} / {totalPages()}
        </span>
        <button
          disabled={page >= totalPages()}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
      {loading && <p>Loading...</p>}
    </div>
  );
}
