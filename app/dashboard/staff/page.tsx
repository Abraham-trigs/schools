// app/staff/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import EditStaffModal from "./components/EditStaffModal.tsx";
import ConfirmDeleteModal from "./components/ConfirmDeleteModal.tsx";
import { useStaffStore, Staff } from "@/app/store/useStaffStore.ts";
import StaffProfileForm from "../staff/components/StaffProfileForm.tsx";

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

  // Add Staff modal state
  const [isAddOpen, setIsAddOpen] = useState(false);

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

  const goToDetail = (id: string) => router.push(`/dashboard/staff/${id}`);

  const handleAddSuccess = (newStaff: any) => {
    console.log("Staff created:", newStaff);
    setIsAddOpen(false);
    fetchStaffDebounced(page, search);
  };

  return (
    <div className="p-4 md:p-6 mt-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2 sm:gap-0">
        <h1 className="text-2xl font-bold">Staff Management</h1>

        {/* Add Staff Button opens Step Form */}
        <button
          type="button"
          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
          onClick={() => setIsAddOpen(true)}
        >
          Add Staff
        </button>
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

      {/* Staff List */}
      {loading ? (
        <div className="p-4 text-center text-gray-500">Loading staff...</div>
      ) : error ? (
        <div className="p-4 text-center text-red-500">{error}</div>
      ) : safeStaffList.length === 0 ? (
        <div className="p-4 text-center text-gray-500">No staff found.</div>
      ) : (
        <>
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

          {/* Mobile Cards */}
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

      {/* Add Staff Modal (Step Form) */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 relative">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              onClick={() => setIsAddOpen(false)}
            >
              ✕
            </button>
            <h2 className="text-xl font-bold mb-4">Add Staff</h2>
            <StaffProfileForm onSuccess={handleAddSuccess} />
          </div>
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
