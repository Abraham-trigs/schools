// app/staff/components/EditStaffModal.tsx
// Purpose: Fully responsive Edit Staff modal, aligned with useStaffStore, safe nested object access, dynamic class loading, optimistic UI, and post-update reset.

"use client";

import React, { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Staff, useStaffStore } from "@/app/store/useStaffStore.ts";
import { useClassesStore } from "@/app/store/useClassesStore.ts";
import {
  inferDepartmentFromPosition,
  requiresClass,
  positionRoleMap,
} from "@/lib/api/constants/roleInference.ts";
import { FaLock, FaUnlock } from "react-icons/fa";
import { toast } from "sonner";

const staffSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().optional(),
  position: z.string().min(1, "Position is required"),
  salary: z.coerce.number().optional(),
  subject: z.string().optional(),
  classId: z.string().nullable().optional(),
});

type StaffFormValues = z.infer<typeof staffSchema>;

interface EditStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EditStaffModal({
  isOpen,
  onClose,
}: EditStaffModalProps) {
  const selectedStaff = useStaffStore((s) => s.selectedStaff);
  const { updateStaff, fetchStaffById } = useStaffStore();
  const classList = useClassesStore((s) => s.classes);
  const fetchClasses = useClassesStore((s) => s.fetchClasses);

  const [isPasswordEditable, setIsPasswordEditable] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
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
      subject: "",
      classId: null,
    },
  });

  const position = watch("position");
  const requiresClassField = requiresClass(position);

  // Reset form whenever selectedStaff changes
  useEffect(() => {
    if (!selectedStaff) return;
    reset({
      name: selectedStaff.user?.name ?? "",
      email: selectedStaff.user?.email ?? "",
      password: "",
      position: selectedStaff.position ?? "",
      salary: selectedStaff.salary ?? undefined,
      subject: selectedStaff.subject ?? "",
      classId: selectedStaff.class?.id ?? null,
    });
    setIsPasswordEditable(false);
  }, [selectedStaff, reset]);

  // Load classes if position requires it
  useEffect(() => {
    if (!requiresClassField) return;
    if (classList.length === 0) {
      setLoadingClasses(true);
      fetchClasses()
        .catch(() => toast.error("Could not load classes"))
        .finally(() => setLoadingClasses(false));
    } else if (selectedStaff?.class?.id) {
      setValue("classId", selectedStaff.class.id);
    }
  }, [
    requiresClassField,
    classList.length,
    fetchClasses,
    setValue,
    selectedStaff,
  ]);

  const positions = Object.keys(positionRoleMap);

  function handleServerErrorPayload(errBody: any) {
    const payload = errBody?.error ?? errBody;
    if (typeof payload === "string") return toast.error(payload);

    if (payload?.fieldErrors && typeof payload.fieldErrors === "object") {
      Object.entries(payload.fieldErrors).forEach(([field, messages]) => {
        if (Array.isArray(messages) && messages.length > 0)
          setError(field as any, {
            type: "server",
            message: messages.join(", "),
          });
      });
      if (Array.isArray(payload.formErrors) && payload.formErrors.length > 0)
        return toast.error(payload.formErrors.join(", "));
      return;
    }

    if (Array.isArray(payload)) {
      payload.forEach((item: any) => {
        if (
          item?.path &&
          Array.isArray(item.path) &&
          item.path.length > 0 &&
          item.message
        )
          setError(String(item.path[0]) as any, {
            type: "server",
            message: item.message,
          });
      });
      return;
    }

    try {
      const text =
        typeof payload === "object" ? JSON.stringify(payload) : String(payload);
      return toast.error(text.slice(0, 200));
    } catch {
      return toast.error("Failed to update staff");
    }
  }

  const onSubmit: SubmitHandler<StaffFormValues> = async (data) => {
    if (!selectedStaff) return;

    setSubmitting(true);
    try {
      const payload: Record<string, any> = {};
      if (data.name.trim() !== selectedStaff.user?.name)
        payload.name = data.name.trim();
      if (data.email.trim() !== selectedStaff.user?.email)
        payload.email = data.email.trim();
      if (data.position !== selectedStaff.position)
        payload.position = data.position;
      if (data.salary !== selectedStaff.salary) payload.salary = data.salary;
      if ((data.subject?.trim() ?? "") !== (selectedStaff.subject ?? ""))
        payload.subject = data.subject?.trim();
      if (requiresClassField && data.classId !== selectedStaff.class?.id)
        payload.classId = data.classId ?? null;
      if (isPasswordEditable && data.password)
        payload.password = data.password.trim();

      if (Object.keys(payload).length === 0) {
        toast.info("No changes to update");
        setSubmitting(false);
        return;
      }

      const selectedClass =
        classList.find((cls) => cls.id === data.classId) ?? null;

      // Optimistic UI update
      updateStaff(selectedStaff.id, {
        user: { ...selectedStaff.user, name: data.name, email: data.email },
        position: data.position,
        class: selectedClass,
        salary: data.salary ?? null,
        subject: data.subject ?? null,
        department: { name: inferDepartmentFromPosition(data.position) ?? "" },
      });

      const res = await fetch(`/api/staff/${selectedStaff.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let errBody: any = null;
        try {
          errBody = await res.json();
        } catch {}
        handleServerErrorPayload(errBody ?? { error: res.statusText });
        throw new Error(errBody?.error ?? "Failed to update staff");
      }

      const result = await res.json();

      reset({
        name: result.user?.name ?? "",
        email: result.user?.email ?? "",
        password: "",
        position: result.position ?? "",
        salary: result.salary ?? undefined,
        subject: result.subject ?? "",
        classId: result.class?.id ?? null,
      });

      toast.success("Staff updated successfully");
      onClose();
      // Refresh store to get latest nested objects
      await fetchStaffById(selectedStaff.id);
      return result;
    } catch (err: any) {
      if (!errors || Object.keys(errors).length === 0)
        toast.error(err?.message ?? "Failed to update staff");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !selectedStaff) return null;

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
          <div>
            <label className="block text-sm font-medium mb-1">Full name</label>
            <input
              {...register("name")}
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-400"
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-red-600 text-sm">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              {...register("email")}
              type="email"
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-400"
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="text-red-600 text-sm">{errors.email.message}</p>
            )}
          </div>

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
                title={isPasswordEditable ? "Lock password" : "Unlock to edit"}
              >
                {isPasswordEditable ? <FaUnlock /> : <FaLock />}
              </button>
            </div>
          </div>

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

          <div>
            <label className="block text-sm font-medium mb-1">Salary</label>
            <input
              {...register("salary")}
              type="number"
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Subject</label>
            <input
              {...register("subject")}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {requiresClassField && (
            <div>
              <label className="block text-sm font-medium mb-1">Class</label>
              <select
                {...register("classId")}
                className="w-full border rounded px-3 py-2"
                disabled={loadingClasses}
              >
                <option value="">
                  {loadingClasses ? "Loading classes..." : "Select class"}
                </option>
                {classList.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
          )}

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
              disabled={submitting || (requiresClassField && loadingClasses)}
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

/* Design reasoning:
- Modal uses store-driven selectedStaff to avoid undefined nested objects.
- Reset after update ensures form reflects backend state.
- Disabled Update button during class loading prevents race conditions.
Structure:
- Default export component EditStaffModal.
- Uses store for selectedStaff and optimistic UI updates via updateStaff.
- Prefills form via react-hook-form safely with optional chaining.
Implementation guidance:
- Ensure fetchStaffById is called before opening modal if only partial staff data is available in row.
- Wire into staff list; call setSelectedStaff on row click.
Scalability insight:
- Can extend to handle nested user relations or additional role-based fields without changing core modal logic.
*/
