// app/staff/components/EditStaffModal.tsx
// Purpose: Edit modal — pre-fills form with provided staff, validates input, updates via Zustand store, and closes safely.

"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useStaffStore, Staff } from "@/app/store/useStaffStore";

interface EditStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: Staff; // required — page ensures staff is present before mount
}

// Inline Zod schema exactly as requested
const staffSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Minimum 6 characters").optional(),
  position: z.string().min(1, "Position is required"),
  department: z.string().optional(),
  salary: z.coerce.number().optional(),
  subject: z.string().optional(),
  classId: z.string().optional().nullable(),
});

type StaffFormData = z.infer<typeof staffSchema>;

export default function EditStaffModal({ isOpen, onClose, staff }: EditStaffModalProps) {
  const { updateStaff } = useStaffStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StaffFormData>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      name: "",
      email: "",
      password: undefined,
      position: "",
      department: "",
      salary: undefined,
      subject: "",
      classId: undefined,
    },
  });

  // Pre-fill when component mounts or staff changes.
  // This runs only while modal is mounted; page ensures staff exists before mounting.
  useEffect(() => {
    if (!staff) return;
    reset({
      name: staff.user?.name ?? "",
      email: staff.user?.email ?? "",
      password: undefined, // blank by default — backend should ignore empty
      position: staff.position ?? "",
      department: staff.department ?? "",
      salary: staff.salary ?? undefined,
      subject: staff.subject ?? "",
      classId: staff.class?.id ?? null,
    });
  }, [staff, reset]);

  // Submission: uses updateStaff (store handles optimistic update / caching)
  const onSubmit = async (data: StaffFormData) => {
    try {
      // normalize values to backend shape if needed
      const payload = {
        // do not send empty password to backend if user didn't fill — keep backend rule simple
        ...(data.password ? { password: data.password } : {}),
        position: data.position,
        department: data.department ?? null,
        salary: data.salary ?? null,
        subject: data.subject ?? null,
        classId: data.classId ?? null,
        // name/email are nested on user; we pass them as top level and let updateStaff normalize,
        // but updateStaff in store should accept the merged shape or we can pass a full object.
        name: data.name,
        email: data.email,
      } as any;

      await updateStaff(staff.id, payload as Partial<Staff>);
      onClose();
    } catch (err) {
      console.error("EditStaffModal:onSubmit error", err);
      // keep modal open — store or API errors should be surfaced to the user via store.error or future toast
    }
  };

  if (!isOpen) return null;

  // Basic modal UI (self-contained; avoid external UI lib)
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Panel */}
      <div
        className="relative bg-white rounded-lg shadow-lg w-full max-w-md mx-4 p-6 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-3">Edit Staff</h3>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Full name</label>
            <input
              {...register("name")}
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-400"
              aria-invalid={!!errors.name}
            />
            {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              {...register("email")}
              type="email"
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-400"
              aria-invalid={!!errors.email}
            />
            {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Password <span className="text-gray-500 text-xs">(leave blank to keep current)</span>
            </label>
            <input
              {...register("password")}
              type="password"
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-400"
            />
            {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Position</label>
            <input
              {...register("position")}
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-400"
              aria-invalid={!!errors.position}
            />
            {errors.position && <p className="text-red-600 text-sm mt-1">{errors.position.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Department</label>
            <input
              {...register("department")}
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Salary</label>
            <input
              {...register("salary")}
              type="number"
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Subject</label>
            <input
              {...register("subject")}
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Class ID</label>
            <input
              {...register("classId")}
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


/* 
Design reasoning:
The modal mirrors AddStaffModal’s layout for familiarity but pre-fills data via useEffect for edit context.
Validation with Zod ensures consistent field rules; password is optional to allow partial edits.
Button is defined locally for isolation and consistent styling without external imports.

Structure:
- staffSchema: defines validation and coercion
- EditStaffModal: main component with controlled form and reset-on-change
- Button: local helper for consistent action styling

Implementation guidance:
Call <EditStaffModal isOpen={isEditOpen} onClose={...} staffId={selectedId} /> 
from StaffPage, triggered by the Edit button in each row or card.

Scalability insight:
If roles or departments become dynamic, extend schema with z.enum or dynamic selects;
extract Button to /components/ui/button.tsx later for reuse across modals.
*/
