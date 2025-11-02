// app/staff/[id]/page.tsx
// Purpose: Individual staff profile page using Zustand store. Supports edit, delete, modals, and redirect after deletion.

"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import { Staff, useStaffStore } from "@/app/store/useStaffStore";
import EditStaffModal from "../components/EditStaffModal";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";

export default function StaffDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const {
    selectedStaff,
    fetchStaffById,
    updateStaff,
    deleteStaff,
    loading,
    error,
  } = useStaffStore();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // --- Fetch staff if not in store ---
  useEffect(() => {
    if (id) fetchStaffById(id);
  }, [id, fetchStaffById]);

  // --- Modal Handlers ---
  const handleEdit = () => setIsEditOpen(true);
  const handleDelete = () => setIsDeleteOpen(true);
  const closeEdit = () => setIsEditOpen(false);
  const closeDelete = () => setIsDeleteOpen(false);

  // --- Delete with redirect ---
  const handleDeleteConfirmed = () => {
    if (!selectedStaff) return;
    deleteStaff(selectedStaff.id, () => {
      router.push("/dashboard/staff");
    });
    closeDelete();
  };

  // --- Update in-place from edit modal ---
  const handleUpdate = (data: Partial<Staff>) => {
    if (!selectedStaff) return;
    updateStaff(selectedStaff.id, data);
  };

  // --- UI States ---
  if (loading && !selectedStaff)
    return (
      <div className="p-6 text-center text-gray-500">Loading staff...</div>
    );

  if (error)
    return (
      <div className="p-6 text-center text-red-500">
        Failed to load staff: {error}
      </div>
    );

  if (!selectedStaff)
    return (
      <div className="p-6 text-center text-gray-500">
        Staff not found or may have been removed.
      </div>
    );

  const staff = selectedStaff;

  return (
    <div className="p-4 md:p-6 space-y-6 mt-6">
      {/* --- Header --- */}
      <header className="flex justify-between items-center flex-wrap gap-3">
        <button
          onClick={() => router.push("/dashboard/staff")}
          className="flex items-center gap-2 text-blue-600 hover:underline focus:outline-none"
          aria-label="Go back to staff list"
        >
          <ArrowLeft size={18} /> Back to all staff
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleEdit}
            className="flex items-center gap-1 px-3 py-1 border border-blue-500 text-blue-600 rounded hover:bg-blue-50 focus:ring-2 focus:ring-blue-400 transition"
          >
            <Edit size={16} /> Edit
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-1 px-3 py-1 border border-red-500 text-red-600 rounded hover:bg-red-50 focus:ring-2 focus:ring-red-400 transition"
          >
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </header>

      {/* --- Profile Summary --- */}
      <section
        className="bg-white shadow-sm rounded-2xl p-5 space-y-3 border border-gray-200"
        aria-labelledby="staff-profile"
      >
        <h2 id="staff-profile" className="text-lg font-semibold border-b pb-2">
          Staff Profile
        </h2>
        <div className="grid sm:grid-cols-2 gap-y-2 text-gray-700">
          <p>
            <span className="font-medium">Name:</span> {staff.user.name}
          </p>
          <p>
            <span className="font-medium">Email:</span> {staff.user.email}
          </p>
          <p>
            <span className="font-medium">Position:</span>{" "}
            {staff.position || "Teacher"}
          </p>
          <p>
            <span className="font-medium">Phone:</span>{" "}
            {staff.user.phone || "—"}
          </p>
        </div>
      </section>

      {/* --- Assigned Class --- */}
      <section
        className="bg-white shadow-sm rounded-2xl p-5 space-y-3 border border-gray-200"
        aria-labelledby="assigned-class"
      >
        <h2 id="assigned-class" className="text-lg font-semibold border-b pb-2">
          Assigned Class
        </h2>
        {staff.class ? (
          <div className="text-gray-700">
            <p>
              <span className="font-medium">Class Name:</span>{" "}
              {staff.class.name}
            </p>
            <p>
              <span className="font-medium">Students:</span>{" "}
              {staff.class.students?.length ?? 0}
            </p>
          </div>
        ) : (
          <p className="text-gray-500">No class assigned yet.</p>
        )}
      </section>

      {/* --- Activity Placeholder --- */}
      <section
        className="bg-white shadow-sm rounded-2xl p-5 border border-gray-200"
        aria-labelledby="recent-activity"
      >
        <h2
          id="recent-activity"
          className="text-lg font-semibold border-b pb-2"
        >
          Recent Activity
        </h2>
        <p className="text-gray-500 text-sm">
          Coming soon — attendance logs, grading summaries, and more.
        </p>
      </section>

      {/* --- Modals --- */}
      {isEditOpen && (
        <EditStaffModal
          isOpen={isEditOpen}
          onClose={closeEdit}
          staff={staff}
          onUpdate={handleUpdate} // optimistic UI update
        />
      )}
      {isDeleteOpen && (
        <ConfirmDeleteModal
          isOpen={isDeleteOpen}
          staff={staff}
          onClose={closeDelete}
          onConfirm={handleDeleteConfirmed} // redirect after delete
        />
      )}
    </div>
  );
}
