"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useClassesStore } from "@/app/store/useClassesStore.ts";
import { useStaffStore } from "@/app/store/useStaffStore.ts";

import {
  roleToDepartment,
  roleRequiresClass,
  positionRoleMap,
  inferRoleFromPosition,
} from "@/lib/api/constants/roleInference.ts";

// -------------------- Schemas --------------------
const userSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const staffSchema = z.object({
  position: z.string().min(1, "Position is required"),
  department: z.string().optional(),
  salary: z.coerce.number().optional(),
  subject: z.string().optional(),
  classId: z.string().optional().nullable(),
});

type UserFormValues = z.infer<typeof userSchema>;
type StaffFormValues = z.infer<typeof staffSchema>;

interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddStaffModal({ isOpen, onClose }: AddStaffModalProps) {
  const { createUser, createStaffRecord, loading: isLoading } = useStaffStore();
  const { classes, fetchClasses } = useClassesStore();

  const [step, setStep] = useState<1 | 2>(1);
  const [userData, setUserData] = useState<{ id: string; role: string } | null>(
    null
  );
  const [apiError, setApiError] = useState<string | null>(null);

  const userForm = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const staffForm = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      position: "",
      department: "",
      salary: undefined,
      subject: "",
      classId: undefined,
    },
  });

  const position = staffForm.watch("position");
  const requiresClass = position
    ? roleRequiresClass.includes(inferRoleFromPosition(position))
    : false;

  // Fetch classes when modal opens
  useEffect(() => {
    if (isOpen) fetchClasses();
  }, [isOpen, fetchClasses]);

  // Auto-fill department on position change
  useEffect(() => {
    if (position && step === 2) {
      const role = inferRoleFromPosition(position);
      staffForm.setValue("department", roleToDepartment[role]);
    }
  }, [position, staffForm, step]);

  // -------------------- Handlers --------------------
  const handleUserSubmit = async (data: UserFormValues) => {
    setApiError(null);
    try {
      const createdUser = await createUser({
        name: data.name,
        email: data.email,
        password: data.password,
      });

      if (createdUser) {
        setUserData({ id: createdUser.id, role: "" }); // role will be inferred in staff step
        setStep(2);
      } else {
        setApiError("Failed to create user. Please try again.");
      }
    } catch (err: any) {
      setApiError(err?.message || "Unexpected error creating user");
    }
  };

  const handleStaffSubmit = async (data: StaffFormValues) => {
    if (!userData) return;
    setApiError(null);

    try {
      const role = inferRoleFromPosition(data.position);
      const createdStaff = await createStaffRecord({
        userId: userData.id,
        position: data.position,
        department: data.department || roleToDepartment[role],
        salary: data.salary ?? null,
        subject: data.subject ?? null,
        classId: data.classId ?? null,
      });

      if (!createdStaff) {
        setApiError("Failed to create staff. Please try again.");
        return;
      }

      // Reset forms & state
      userForm.reset();
      staffForm.reset();
      setStep(1);
      setUserData(null);
      onClose();
    } catch (err: any) {
      setApiError(err?.message || "Unexpected error creating staff");
    }
  };

  const positions = Object.keys(positionRoleMap);

  // -------------------- Render --------------------
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/30" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-lg z-50">
          <DialogTitle className="text-lg font-semibold mb-4">
            Add New Staff
          </DialogTitle>

          {step === 1 && (
            <form
              onSubmit={userForm.handleSubmit(handleUserSubmit)}
              className="space-y-4"
            >
              {apiError && <p className="text-sm text-red-600">{apiError}</p>}

              <div>
                <label className="block text-sm font-medium">Full Name</label>
                <input
                  {...userForm.register("name")}
                  className="mt-1 w-full rounded-md border px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Email</label>
                <input
                  {...userForm.register("email")}
                  className="mt-1 w-full rounded-md border px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Password</label>
                <input
                  type="password"
                  {...userForm.register("password")}
                  className="mt-1 w-full rounded-md border px-3 py-2"
                />
              </div>

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
                  Next
                </button>
              </div>
            </form>
          )}

          {step === 2 && (
            <form
              onSubmit={staffForm.handleSubmit(handleStaffSubmit)}
              className="space-y-4"
            >
              {apiError && <p className="text-sm text-red-600">{apiError}</p>}

              <div>
                <label className="block text-sm font-medium">Position</label>
                <select
                  {...staffForm.register("position")}
                  className="mt-1 w-full rounded-md border px-3 py-2"
                >
                  <option value="">Select position</option>
                  {positions.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium">Department</label>
                <input
                  {...staffForm.register("department")}
                  className="mt-1 w-full rounded-md border px-3 py-2"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Salary</label>
                <input
                  type="number"
                  step="0.01"
                  {...staffForm.register("salary")}
                  className="mt-1 w-full rounded-md border px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Subject</label>
                <input
                  {...staffForm.register("subject")}
                  className="mt-1 w-full rounded-md border px-3 py-2"
                />
              </div>

              {requiresClass && (
                <div>
                  <label className="block text-sm font-medium">Class</label>
                  <select
                    {...staffForm.register("classId")}
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

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="rounded-md border px-4 py-2"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  Create Staff
                </button>
              </div>
            </form>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
}
