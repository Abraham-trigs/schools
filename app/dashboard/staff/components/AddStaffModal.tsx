// app/dashboard/staff/components/AddStaffModal.tsx
// Purpose: Modal form to create new staff with multi-subject selection and school linkage

"use client";

import { useEffect, useState } from "react";
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

// ---------------------- Schema ----------------------
const staffSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  position: z.string().min(1),
  department: z.string().optional(),
  salary: z.coerce.number().optional(),
  classId: z.string().optional().nullable(),
  subjectIds: z.array(z.string()).optional(), // Multi-subject IDs
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

  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

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
      classId: undefined,
      subjectIds: [],
    },
  });

  const position = watch("position");

  // Fetch classes and subjects on open
  useEffect(() => {
    if (isOpen) {
      fetchClasses();
      fetchSubjects();
    }
  }, [isOpen, fetchClasses, fetchSubjects]);

  // Auto-fill department based on position
  useEffect(() => {
    if (position) {
      const role = inferRoleFromPosition(position);
      const inferredDept = role ? roleToDepartment[role] : undefined;
      if (inferredDept)
        reset((prev) => ({ ...prev, department: inferredDept }));
    }
  }, [position, reset]);

  const requiresClass = position
    ? roleRequiresClass.includes(inferRoleFromPosition(position))
    : false;

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
      subjectIds: selectedSubjects, // map selected subjects
    };
    await createStaff(userPayload, staffPayload);
    reset();
    setSelectedSubjects([]);
    onClose();
  };

  const positions = Object.keys(positionRoleMap);

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/30" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-lg z-50">
          <DialogTitle className="text-lg font-semibold mb-4">
            Add New Staff
          </DialogTitle>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name / Email / Password / Position / Department / Salary / Class fields remain same */}
            {/* --- Subjects multi-select --- */}
            <div>
              <label className="block text-sm font-medium mb-1">Subjects</label>
              <Controller
                name="subjectIds"
                control={control}
                render={() => (
                  <div className="flex flex-col gap-1 max-h-40 overflow-y-auto border rounded p-2">
                    {subjects.map((subj) => (
                      <label key={subj.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          value={subj.id}
                          checked={selectedSubjects.includes(subj.id)}
                          onChange={(e) => {
                            const val = subj.id;
                            setSelectedSubjects((prev) =>
                              e.target.checked
                                ? [...prev, val]
                                : prev.filter((id) => id !== val)
                            );
                          }}
                        />
                        {subj.name}
                      </label>
                    ))}
                  </div>
                )}
              />
            </div>

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

/* ✅ Design reasoning:
- Multi-select checkboxes directly map to Staff.subjects (many-to-many) in Prisma.
- Reset selectedSubjects after create ensures next form is empty.
- SchoolId linkage is handled in backend via logged-in user.
*/
