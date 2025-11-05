// app/dashboard/staff/components/AddStaffModal.tsx
// Purpose: Modal form to create new staff; supports multi-subject selection, infers role/department/class automatically,
//          posts via Zustand store (useStaffStore), supports optimistic UI and school scoping.

"use client";

import { useEffect } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useStaffStore } from "@/app/store/useStaffStore";
import { useClassesStore } from "@/app/store/useClassesStore";
import { useSubjectStore } from "@/app/store/subjectStore.ts";
import {
  roleToDepartment,
  roleRequiresClass,
  positionRoleMap,
  inferRoleFromPosition,
} from "@/lib/api/constants/roleInference";
import Select from "react-select";

// ---------------------- Schema ----------------------
const staffSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Minimum 6 characters"),
  position: z.string().min(1, "Position is required"),
  department: z.string().optional(),
  salary: z.coerce.number().optional(),
  subjects: z.array(z.string()).optional(),
  classId: z.string().optional().nullable(),
});

type StaffFormValues = z.infer<typeof staffSchema>;

interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ---------------------- Modal Component ----------------------
export default function AddStaffModal({ isOpen, onClose }: AddStaffModalProps) {
  const { createStaff, loading: isLoading } = useStaffStore();
  const { classes, fetchClasses } = useClassesStore();
  const { subjects, fetchSubjects } = useSubjectStore();

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
    },
  });

  const position = watch("position");

  // ---------------------- Fetch classes & subjects when modal opens ----------------------
  useEffect(() => {
    if (isOpen) {
      fetchClasses();
      fetchSubjects();
    }
  }, [isOpen, fetchClasses, fetchSubjects]);

  // ---------------------- Auto-fill department based on role ----------------------
  useEffect(() => {
    if (position) {
      const inferredRole = inferRoleFromPosition(position);
      const inferredDept = inferredRole
        ? roleToDepartment[inferredRole]
        : undefined;
      if (inferredDept)
        reset((prev) => ({ ...prev, department: inferredDept }));
    }
  }, [position, reset]);

  const requiresClass = position
    ? roleRequiresClass.includes(inferRoleFromPosition(position))
    : false;

  // ---------------------- Submit handler ----------------------
  const onSubmit = async (data: StaffFormValues) => {
    const role = inferRoleFromPosition(data.position);

    const userPayload = {
      name: data.name,
      email: data.email,
      password: data.password,
      role,
    };

    const staffPayload = {
      position: data.position,
      department: data.department || roleToDepartment[role],
      classId: data.classId ?? null,
      salary: data.salary ?? null,
      subjects: data.subjects ?? [],
    };

    await createStaff(userPayload, staffPayload);

    reset();
    onClose();
  };

  const positions = Object.keys(positionRoleMap);
  const subjectOptions = subjects.map((s) => ({
    value: s.name,
    label: s.name,
  }));

  // ---------------------- Render ----------------------
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/30" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-lg z-50">
          <DialogTitle className="text-lg font-semibold mb-4">
            Add New Staff
          </DialogTitle>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium">Full Name</label>
              <input
                {...register("name")}
                className="mt-1 w-full rounded-md border px-3 py-2"
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium">Email</label>
              <input
                {...register("email")}
                className="mt-1 w-full rounded-md border px-3 py-2"
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium">Password</label>
              <input
                type="password"
                {...register("password")}
                className="mt-1 w-full rounded-md border px-3 py-2"
              />
              {errors.password && (
                <p className="text-sm text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Position */}
            <div>
              <label className="block text-sm font-medium">Position</label>
              <select
                {...register("position")}
                className="mt-1 w-full rounded-md border px-3 py-2"
              >
                <option value="">Select role</option>
                {positions.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
              {errors.position && (
                <p className="text-sm text-red-500">
                  {errors.position.message}
                </p>
              )}
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium">Department</label>
              <input
                {...register("department")}
                className="mt-1 w-full rounded-md border px-3 py-2"
              />
            </div>

            {/* Salary */}
            <div>
              <label className="block text-sm font-medium">Salary</label>
              <input
                type="number"
                step="0.01"
                {...register("salary")}
                className="mt-1 w-full rounded-md border px-3 py-2"
              />
            </div>

            {/* Subjects - Multi Select */}
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
                      onChange(selected.map((s) => s.value))
                    }
                  />
                )}
              />
            </div>

            {/* Class (conditionally rendered) */}
            {requiresClass && (
              <div>
                <label className="block text-sm font-medium">Class</label>
                <select
                  {...register("classId")}
                  className="mt-1 w-full rounded-md border px-3 py-2"
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

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border px-4 py-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? "Saving..." : "Create Staff"}
              </button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

/* Design reasoning:
- Uses Zustand stores for subjects, classes, and staff to maintain consistent state across the dashboard.
- Multi-select for subjects improves UX for teachers handling multiple subjects and reduces manual errors.
- Auto-fills department and conditionally renders class dropdown based on position for clarity and efficiency.

Structure:
- Main exported component: AddStaffModal
- Form with react-hook-form + Zod validation
- Controller used for multi-select subject integration
- Form reset on modal close or successful submit

Implementation guidance:
- Ensure `fetchSubjects()` and `fetchClasses()` are invoked on modal open to populate selects.
- Can extend to bulk assignment or role-specific logic.

Scalability insight:
- Multi-select pattern allows extending to other relational fields (skills, certifications) without changing core modal logic.
*/
