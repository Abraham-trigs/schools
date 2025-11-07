// app/dashboard/staff/components/EditStaffModal.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Staff, useStaffStore } from "@/app/store/useStaffStore";
import { useClassesStore } from "@/app/store/useClassesStore";
import { useSubjectStore } from "@/app/store/subjectStore";
import {
  inferDepartmentFromPosition,
  requiresClass,
  positionRoleMap,
} from "@/lib/api/constants/roleInference";
import { toast } from "sonner";
import { FaLock, FaUnlock } from "react-icons/fa";

interface EditStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: Staff;
}

const staffSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().optional(),
  position: z.string().min(1, "Position is required"),
  salary: z.coerce.number().optional(),
  subject: z.string().nullable().optional(),
  classId: z.string().nullable().optional(),
});

type StaffFormValues = z.infer<typeof staffSchema>;

export default function EditStaffModal({
  isOpen,
  onClose,
  staff,
}: EditStaffModalProps) {
  const { updateStaff } = useStaffStore();
  const classList = useClassesStore((s) => s.classes);
  const fetchClasses = useClassesStore((s) => s.fetchClasses);

  const { subjects, fetchSubjects } = useSubjectStore();

  const [isPasswordEditable, setIsPasswordEditable] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      position: "",
      salary: undefined,
      subject: null,
      classId: null,
    },
  });

  const position = watch("position");
  const selectedClassId = watch("classId");
  const requiresClassField = requiresClass(position);

  // ----------------- Step 1: Prefill form when staff or modal opens -----------------
  useEffect(() => {
    if (!staff) return;
    reset({
      name: staff.user.name,
      email: staff.user.email,
      password: "",
      position: staff.position ?? "",
      salary: staff.salary ?? undefined,
      subject: staff.subject ?? null,
      classId: staff.class?.id ?? null,
    });
    setIsPasswordEditable(false);
  }, [staff, reset]);

  // ----------------- Step 2: Fetch classes if empty -----------------
  useEffect(() => {
    if (!requiresClassField) return;

    if (classList.length === 0) {
      setLoadingClasses(true);
      fetchClasses()
        .catch(() => toast.error("Could not load classes"))
        .finally(() => setLoadingClasses(false));
    }
  }, [requiresClassField, classList.length, fetchClasses]);

  // ----------------- Step 3: Fetch subjects based on selected class -----------------
  useEffect(() => {
    if (!selectedClassId) return;

    setLoadingSubjects(true);
    fetchSubjects(1, "", { classId: selectedClassId })
      .then(() => {
        if (staff?.subject) setValue("subject", staff.subject);
      })
      .catch(() => toast.error("Could not load subjects"))
      .finally(() => setLoadingSubjects(false));
  }, [selectedClassId, fetchSubjects, staff, setValue]);

  const positions = Object.keys(positionRoleMap);

  const onSubmit: SubmitHandler<StaffFormValues> = async (data) => {
    setSubmitting(true);
    try {
      const payload: Record<string, any> = {};
      if (data.name.trim() !== staff.user.name) payload.name = data.name.trim();
      if (data.email.trim() !== staff.user.email)
        payload.email = data.email.trim();
      if (data.position !== staff.position) payload.position = data.position;
      if (data.salary !== staff.salary) payload.salary = data.salary;
      if ((data.subject?.trim() ?? "") !== (staff.subject ?? ""))
        payload.subject = data.subject?.trim();
      if (requiresClassField && data.classId !== staff.class?.id)
        payload.classId = data.classId ?? null;
      if (isPasswordEditable && data.password)
        payload.password = data.password.trim();

      if (Object.keys(payload).length === 0) {
        toast.info("No changes to update");
        setSubmitting(false);
        return;
      }

      // Optimistic UI
      const selectedClass =
        classList.find((cls) => cls.id === data.classId) ?? null;
      updateStaff(staff.id, {
        user: { ...staff.user, name: data.name, email: data.email },
        position: data.position,
        class: selectedClass,
        salary: data.salary ?? null,
        subject: data.subject ?? null,
        department: { name: inferDepartmentFromPosition(data.position) ?? "" },
      });

      const res = await fetch(`/api/staff/${staff.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        toast.error(errBody?.error ?? res.statusText);
        throw new Error(errBody?.error ?? "Failed to update staff");
      }

      toast.success("Staff updated successfully");
      onClose();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to update staff");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative bg-white rounded-lg shadow-lg w-full max-w-md mx-4 p-6 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-3">Edit Staff</h3>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-3"
          noValidate
        >
          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1">Full name</label>
            <input
              {...register("name")}
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-400"
              aria-invalid={!!errors.name}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              {...register("email")}
              type="email"
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-400"
              aria-invalid={!!errors.email}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <div className="flex gap-2 items-center">
              <input
                {...register("password")}
                type="password"
                disabled={!isPasswordEditable}
                placeholder={
                  isPasswordEditable ? "Enter new password" : "Locked"
                }
                className="flex-1 border rounded px-3 py-2 focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100"
              />
              <button
                type="button"
                onClick={() => setIsPasswordEditable((p) => !p)}
                className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
              >
                {isPasswordEditable ? <FaUnlock /> : <FaLock />}
              </button>
            </div>
          </div>

          {/* Position */}
          <div>
            <label className="block text-sm font-medium mb-1">Position</label>
            <select
              {...register("position")}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Select role</option>
              {positions.map((pos) => (
                <option key={pos} value={pos}>
                  {pos.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          {/* Department (non-editable) */}
          <div>
            <label className="block text-sm font-medium mb-1">Department</label>
            <input
              value={inferDepartmentFromPosition(position) ?? ""}
              disabled
              className="w-full border rounded px-3 py-2 bg-gray-100"
            />
          </div>

          {/* Class */}
          {requiresClassField && (
            <div>
              <label className="block text-sm font-medium mb-1">Class</label>
              <select
                {...register("classId")}
                disabled={loadingClasses}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">
                  {loadingClasses ? "Loading..." : "Select class"}
                </option>
                {classList.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Subject */}
          {requiresClassField && (
            <div>
              <label className="block text-sm font-medium mb-1">Subject</label>
              <select
                {...register("subject")}
                disabled={loadingSubjects || subjects.length === 0}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">
                  {loadingSubjects ? "Loading subjects..." : "Select subject"}
                </option>
                {subjects.map((subj) => (
                  <option key={subj.id} value={subj.name}>
                    {subj.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Salary */}
          <div>
            <label className="block text-sm font-medium mb-1">Salary</label>
            <input
              {...register("salary")}
              type="number"
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 border rounded hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {submitting ? "Updating..." : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
