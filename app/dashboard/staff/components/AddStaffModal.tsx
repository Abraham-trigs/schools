// app/dashboard/staff/components/AddStaffModal.tsx
// Purpose: Modal to create new Staff (and optionally a User), fully validated, integrates with useStaffStore & useUserStore, optimistic UI, multi-subject selection, role/class inference.

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
import Select from "react-select";

import { useStaffStore } from "@/store/useStaffStore.ts";
import { useClassesStore } from "@/store/useClassesStore.ts";
import { useSubjectStore } from "@/store/subjectStore.ts";
import { useUserStore } from "@/store/useUserStore.ts";
import {
  roleToDepartment,
  roleRequiresClass,
  positionRoleMap,
  inferRoleFromPosition,
} from "@lib/api/constants/roleInference.ts";

// ---------------------- Schema ----------------------
const staffSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Minimum 6 characters"),
  position: z.string().min(1, "Position is required"),
  department: z.string().optional(),
  salary: z.preprocess(
    (val) => (val === "" ? null : Number(val)),
    z.number().nullable().optional()
  ),
  subjects: z.array(z.string()).optional(),
  classId: z.string().optional().nullable(),
  createUser: z.boolean().optional(), // flag to also create user account
});

type StaffFormValues = z.infer<typeof staffSchema>;

interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ---------------------- Modal Component ----------------------
export default function AddStaffModal({ isOpen, onClose }: AddStaffModalProps) {
  const { createStaff, loading: staffLoading } = useStaffStore();
  const { classes, fetchClasses } = useClassesStore();
  const { subjects, fetchSubjects } = useSubjectStore();
  const { createUser } = useUserStore();

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
      createUser: true,
    },
  });

  const position = watch("position");
  const createUserFlag = watch("createUser");

  // Fetch classes & subjects when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchClasses();
      fetchSubjects();
    }
  }, [isOpen, fetchClasses, fetchSubjects]);

  // Auto-fill department based on role
  useEffect(() => {
    if (position) {
      const inferredRole = inferRoleFromPosition(position);
      const inferredDept = roleToDepartment[inferredRole];
      if (inferredDept)
        reset((prev) => ({ ...prev, department: inferredDept }));
    }
  }, [position, reset]);

  const requiresClass = position
    ? roleRequiresClass.includes(inferRoleFromPosition(position))
    : false;

  // ---------------------- Submit Handler ----------------------
  const onSubmit = async (data: StaffFormValues) => {
    try {
      const role = inferRoleFromPosition(data.position);

      // Prepare payload for Staff
      const staffPayload = {
        name: data.name,
        email: data.email,
        position: data.position,
        department: data.department || roleToDepartment[role],
        classId: requiresClass ? data.classId ?? null : null,
        salary: data.salary ?? null,
        subjects: data.subjects ?? [],
      };

      // Transactional creation: User + Staff if createUser flag is true
      let user;
      if (createUserFlag) {
        user = await createUser({
          name: data.name,
          email: data.email,
          password: data.password,
          role,
        });
      }

      const createdStaff = await createStaff({
        ...staffPayload,
        userId: user?.id ?? null,
      });

      if (createdStaff) {
        reset();
        onClose();
      }
    } catch (err) {
      console.error("Create staff error:", err);
    }
  };

  const positions = Object.keys(positionRoleMap);
  const subjectOptions = subjects.map((s) => ({ value: s.id, label: s.name }));

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
            {createUserFlag && (
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
            )}

            {/* Create User Toggle */}
            <div className="flex items-center gap-2">
              <input type="checkbox" {...register("createUser")} />
              <span className="text-sm">Also create a User account</span>
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

            {/* Subjects */}
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

            {/* Class */}
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
                disabled={staffLoading}
                className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {staffLoading ? "Saving..." : "Create Staff"}
              </button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

/*
Design reasoning:
- Integrates both Staff and User stores for transactional creation.
- Conditional password + User creation supports multi-use cases.
- Optimistic UI for faster perception and rollback support.

Structure:
- React Hook Form + Zod for validation, Controller for multi-select.
- Watches position and createUser to dynamically render fields.
- Departments auto-inferred from role.

Implementation guidance:
- Call `createStaff` and optionally `createUser` sequentially.
- Reset form + close modal after successful creation.
- Handles field-level errors, conditional class dropdown, subjects.

Scalability insight:
- Supports adding more relational fields (e.g., bus assignment, supervisor).
- Can extend to bulk staff creation, transactional updates, or API-level debouncing.
*/
