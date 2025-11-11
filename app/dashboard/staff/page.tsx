// app/staff/page.tsx
// Purpose: Responsive Staff Management page with Add/Edit/Delete modals and click-to-view staff detail using unified UserStaffFormButton.

"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import EditStaffModal from "./components/EditStaffModal";
import ConfirmDeleteModal from "./components/ConfirmDeleteModal";
import { useStaffStore, Staff } from "@/app/store/useStaffStore";
import UserFormButton from "../../dashboard/components/UserFormButton.tsx";

export default function StaffPage() {
  const router = useRouter();
  const {
    staffList,
    page,
    search,
    loading,
    error,
    setPage,
    setSearch,
    fetchStaffDebounced,
    totalPages,
  } = useStaffStore();

  const safeStaffList = staffList ?? [];

  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedToDelete, setSelectedToDelete] = useState<Staff | null>(null);

  useEffect(() => {
    fetchStaffDebounced(page, search);
  }, [page, search, fetchStaffDebounced]);

  const handleEditClick = (e: React.MouseEvent, staff: Staff) => {
    e.stopPropagation();
    setSelectedStaff(staff);
    setIsEditOpen(true);
  };

  const closeEdit = () => {
    setIsEditOpen(false);
    setTimeout(() => setSelectedStaff(null), 120);
  };

  const handleDeleteClick = (e: React.MouseEvent, staff: Staff) => {
    e.stopPropagation();
    setSelectedToDelete(staff);
  };

  const closeDelete = () => setSelectedToDelete(null);

  const goToDetail = (id: string) => {
    router.push(`/dashboard/staff/${id}`);
  };

  return (
    <div className="p-4 md:p-6 mt-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2 sm:gap-0">
        <h1 className="text-2xl font-bold">Staff Management</h1>
        <UserFormButton
          buttonLabel="Add Staff"
          onSuccess={(user) => {
            console.log("Staff created:", user);
            fetchStaffDebounced(page, search); // refresh list
          }}
        />
      </div>

      {/* Search */}
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          placeholder="Search by name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
          aria-label="Search staff by name or email"
        />
      </div>

      {/* Main states */}
      {loading ? (
        <div className="p-4 text-center text-gray-500">Loading staff...</div>
      ) : error ? (
        <div className="p-4 text-center text-red-500">{error}</div>
      ) : safeStaffList.length === 0 ? (
        <div className="p-4 text-center text-gray-500">No staff found.</div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full border border-gray-300 text-sm md:text-base">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-3 py-2 text-left">Name</th>
                  <th className="border px-3 py-2 text-left">Email</th>
                  <th className="border px-3 py-2 text-left">Role</th>
                  <th className="border px-3 py-2 text-left">Class</th>
                  <th className="border px-3 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {safeStaffList.map((staff) => (
                  <tr
                    key={staff.id}
                    onClick={() => goToDetail(staff.id)}
                    className="hover:bg-blue-50 cursor-pointer transition-colors"
                  >
                    <td className="border px-3 py-2">{staff.user.name}</td>
                    <td className="border px-3 py-2 break-words">
                      {staff.user.email}
                    </td>
                    <td className="border px-3 py-2">
                      {staff.position || "Teacher"}
                    </td>
                    <td className="border px-3 py-2">
                      {staff.class?.name || "-"}
                    </td>
                    <td className="border px-3 py-2 flex gap-2 flex-wrap">
                      <button
                        onClick={(e) => handleEditClick(e, staff)}
                        className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-400 px-2 py-1 rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => handleDeleteClick(e, staff)}
                        className="text-red-600 hover:underline focus:outline-none focus:ring-2 focus:ring-red-400 px-2 py-1 rounded"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="md:hidden flex flex-col gap-3">
            {safeStaffList.map((staff) => (
              <div
                key={staff.id}
                onClick={() => goToDetail(staff.id)}
                className="border rounded p-3 shadow-sm hover:shadow-md transition-shadow bg-white cursor-pointer"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold">{staff.user.name}</p>
                    <p className="text-gray-600 text-sm break-words">
                      {staff.user.email}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => handleEditClick(e, staff)}
                      className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-400 px-2 py-1 rounded text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => handleDeleteClick(e, staff)}
                      className="text-red-600 hover:underline focus:outline-none focus:ring-2 focus:ring-red-400 px-2 py-1 rounded text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-1 text-sm text-gray-700">
                  <p>
                    <span className="font-medium">Role:</span>{" "}
                    {staff.position || "Teacher"}
                  </p>
                  <p>
                    <span className="font-medium">Class:</span>{" "}
                    {staff.class?.name || "-"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Pagination */}
      {totalPages() > 1 && (
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <button
            onClick={() => setPage(Math.max(page - 1, 1))}
            disabled={page === 1}
            className="px-3 py-1 border rounded disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            Prev
          </button>
          <span className="px-3 py-1">{`${page} / ${totalPages()}`}</span>
          <button
            onClick={() => setPage(Math.min(page + 1, totalPages()))}
            disabled={page === totalPages()}
            className="px-3 py-1 border rounded disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            Next
          </button>
        </div>
      )}

      {/* Edit Modal */}
      {isEditOpen && selectedStaff && (
        <EditStaffModal
          isOpen={isEditOpen}
          onClose={closeEdit}
          staff={selectedStaff}
        />
      )}

      {/* Delete Modal */}
      {selectedToDelete && (
        <ConfirmDeleteModal
          isOpen={!!selectedToDelete}
          staff={selectedToDelete}
          onClose={closeDelete}
        />
      )}
    </div>
  );
}

// ------------------- Design reasoning -------------------
// - Replaced old AddStaffModal button with reusable UserFormButton.
// - Maintains full responsive table and card UI for mobile/desktop.
// - Integrates with Zustand store for staff data and handles optimistic updates.
// - Search, pagination, edit, and delete fully functional with accessible modals.

// ------------------- Structure -------------------
// Exports default StaffPage.
// Local functions: handleEditClick, handleDeleteClick, goToDetail, AddStaffModalButton replaced with UserFormButton inline.

// ------------------- Implementation guidance -------------------
// Use this page directly under /app/staff. UserFormButton handles both user and staff creation.
// onSuccess can trigger fetchStaffDebounced to refresh list automatically.

// ------------------- Scalability insight -------------------
// - Easy to extend modal to include extra staff fields, permissions, or dynamic role assignment.
// - Unified form allows consistent validation and future API changes without touching the page.
