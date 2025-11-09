"use client";

// File: app/dashboard/staff/components/AddStaffModal.tsx
// Purpose: Modal form to create new staff; supports dynamic fields for roles, multi-subject selection, validation, and integrates with useStaffStore.

import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useStaffStore } from "@/app/store/useStaffStore";
import { useClassesStore } from "@/app/store/useClassesStore";
import { useSubjectsStore } from "@/app/store/subjectStore";
import Select from "react-select";
import {
  inferRoleFromPosition,
  roleRequiresClass,
  rolesWithSubjects,
  roleToDepartment,
  positionRoleMap,
} from "@/lib/api/constants/roleInference";

// ---------------------- Validation Schema ----------------------
const staffSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Minimum 6 characters"),
  position: z.string().min(1, "Position is required"),
  department: z.string().optional(),
  salary: z.coerce.number().optional(),
  subjects: z.array(z.string()).optional(),
  classId: z.string().optional().nullable(),
  hireDate: z.string().optional(),
});

type StaffFormValues = z.infer<typeof staffSchema>;

interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ---------------------- Modal Component ----------------------
export default function AddStaffModal({ isOpen, onClose }: AddStaffModalProps) {
  const { createStaff, loading: isLoading, error } = useStaffStore();
  const { classes, fetchClasses } = useClassesStore();
  const { subjects, fetchSubjects } = useSubjectsStore();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    control,
    formState: { errors },
  } = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      position: "",
      department: "",
      salary: undefined,
      subjects: [],
      classId: undefined,
      hireDate: new Date().toISOString().slice(0, 10),
    },
  });

  const position = watch("position");
  const role = position ? inferRoleFromPosition(position) : null;
  const requiresClassField = role ? roleRequiresClass.includes(role) : false;
  const showSubjects = role ? rolesWithSubjects.includes(role) : false;

  // ---------------------- Fetch classes & subjects ----------------------
  useEffect(() => {
    if (isOpen) {
      fetchClasses();
      fetchSubjects();
    }
  }, [isOpen, fetchClasses, fetchSubjects]);

  // ---------------------- Auto-fill department ----------------------
  useEffect(() => {
    if (position) {
      const inferredRole = inferRoleFromPosition(position);
      const inferredDept = roleToDepartment[inferredRole];
      if (inferredDept)
        reset((prev) => ({ ...prev, department: inferredDept }));
    }
  }, [position, reset]);

  // ---------------------- Submit Handler ----------------------
  const onSubmit = async (data: StaffFormValues) => {
    try {
      // Normalize payload before sending
      const payload = {
        ...data,
        salary: data.salary ?? null,
        classId: requiresClassField ? data.classId ?? null : null,
        subjects: showSubjects ? data.subjects ?? [] : [],
      };

      await createStaff(payload);

      // Reset form and close modal on success
      reset();
      onClose();
    } catch (err) {
      console.error("Failed to create staff:", err);
    }
  };

  if (!isOpen) return null;

  const positions = Object.keys(positionRoleMap);
  const subjectOptions = subjects.map((s) => ({
    value: s.name,
    label: s.name,
  }));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">Add New Staff</h2>

        {error && <p className="text-red-500 mb-2">{error}</p>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium">Full Name</label>
            <input
              {...register("name")}
              className="mt-1 w-full border rounded px-2 py-1"
            />
            {errors.name && (
              <p className="text-red-500 text-sm">{errors.name.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              {...register("email")}
              className="mt-1 w-full border rounded px-2 py-1"
            />
            {errors.email && (
              <p className="text-red-500 text-sm">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium">Password</label>
            <input
              type="password"
              {...register("password")}
              className="mt-1 w-full border rounded px-2 py-1"
            />
            {errors.password && (
              <p className="text-red-500 text-sm">{errors.password.message}</p>
            )}
          </div>

          {/* Position */}
          <div>
            <label className="block text-sm font-medium">Position</label>
            <select
              {...register("position")}
              className="mt-1 w-full border rounded px-2 py-1"
            >
              <option value="">Select position</option>
              {positions.map((pos) => (
                <option key={pos} value={pos}>
                  {pos.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            {errors.position && (
              <p className="text-red-500 text-sm">{errors.position.message}</p>
            )}
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium">Department</label>
            <input
              {...register("department")}
              className="mt-1 w-full border rounded px-2 py-1"
            />
          </div>

          {/* Class */}
          {requiresClassField && (
            <div>
              <label className="block text-sm font-medium">Class</label>
              <select
                {...register("classId")}
                className="mt-1 w-full border rounded px-2 py-1"
              >
                <option value="">Select class</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Subjects */}
          {showSubjects && (
            <div>
              <label className="block text-sm font-medium">Subjects</label>
              <Controller
                control={control}
                name="subjects"
                render={({ field: { onChange, value } }) => (
                  <Select
                    isMulti
                    options={subjectOptions}
                    value={subjectOptions.filter((s) =>
                      value?.includes(s.value)
                    )}
                    onChange={(selected) =>
                      onChange(selected.map((s: { value: string }) => s.value))
                    }
                  />
                )}
              />
            </div>
          )}

          {/* Salary */}
          <div>
            <label className="block text-sm font-medium">Salary</label>
            <input
              type="number"
              step="0.01"
              {...register("salary")}
              className="mt-1 w-full border rounded px-2 py-1"
            />
          </div>

          {/* Hire Date */}
          <div>
            <label className="block text-sm font-medium">Hire Date</label>
            <input
              type="date"
              {...register("hireDate")}
              className="mt-1 w-full border rounded px-2 py-1"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? "Saving..." : "Create Staff"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/*
Design reasoning → Modal provides a clean UX for adding staff. Fields dynamically show based on role. Subjects/class appear only for relevant positions. Optimistic UI improves performance.

Structure → React Hook Form + Zod for validation. Conditional rendering for dynamic fields. Integrates directly with useStaffStore for CRUD.

Implementation guidance → Submit normalized payload. Reset form and close modal on success. Inline validation feedback improves usability.

Scalability insight → Supports additional roles, fields, or multi-select subjects. Can be extended for editing staff with minimal changes.

Example usage:
<AddStaffModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} />
*/
