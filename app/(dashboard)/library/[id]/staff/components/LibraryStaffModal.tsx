// app/(library)/staff/LibraryStaffModal.tsx
"use client";
import { useState, useEffect } from "react";
import { useLibraryStaffStore } from "@/store/useLibraryStaffStore";

interface Props {
  staff: any;
  onClose: () => void;
}
export default function LibraryStaffModal({ staff, onClose }: Props) {
  const { createStaff, updateStaff, deleteStaff } = useLibraryStaffStore();
  const [form, setForm] = useState({
    name: "",
    email: "",
    position: "",
    departmentId: "",
    password: "",
  });

  useEffect(() => {
    if (staff) setForm({ ...staff, password: "" });
  }, [staff]);

  const handleSubmit = async () => {
    if (staff?.id) await updateStaff(staff.id, form);
    else await createStaff(form);
    onClose();
  };

  const handleDelete = async () => {
    if (staff?.id) {
      await deleteStaff(staff.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white p-4 rounded w-96">
        <h2>{staff?.id ? "Edit Staff" : "Add Staff"}</h2>
        <input
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Name"
          className="border p-1 w-full mb-2"
        />
        <input
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          placeholder="Email"
          className="border p-1 w-full mb-2"
        />
        {!staff?.id && (
          <input
            value={form.password}
            type="password"
            onChange={(e) =>
              setForm((f) => ({ ...f, password: e.target.value }))
            }
            placeholder="Password"
            className="border p-1 w-full mb-2"
          />
        )}
        <input
          value={form.position || ""}
          onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
          placeholder="Position"
          className="border p-1 w-full mb-2"
        />
        <input
          value={form.departmentId || ""}
          onChange={(e) =>
            setForm((f) => ({ ...f, departmentId: e.target.value }))
          }
          placeholder="Department ID"
          className="border p-1 w-full mb-2"
        />
        <div className="flex justify-between mt-4">
          <button
            onClick={handleSubmit}
            className="bg-blue-500 text-white px-4 py-1 rounded"
          >
            {staff?.id ? "Update" : "Create"}
          </button>
          {staff?.id && (
            <button
              onClick={handleDelete}
              className="bg-red-500 text-white px-4 py-1 rounded"
            >
              Delete
            </button>
          )}
          <button onClick={onClose} className="bg-gray-300 px-4 py-1 rounded">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
