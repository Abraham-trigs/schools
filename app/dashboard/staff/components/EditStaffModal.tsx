// app/staff/components/EditStaffModal.tsx
// Purpose: Fully responsive Edit Staff modal with dynamic class loading, safe PUT request, field-level server error mapping, and optimistic UI.

"use client";

import React, { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Staff, useStaffStore } from "@/app/store/useStaffStore";
import { useClassesStore } from "@/app/store/useClassesStore";
import {
  inferDepartmentFromPosition,
  requiresClass,
  positionRoleMap,
} from "@/lib/api/constants/roleInference";
import { FaLock, FaUnlock } from "react-icons/fa";
import { toast } from "sonner";

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
  subject: z.string().optional(),
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

  // Prefill form when staff or modal opens
  useEffect(() => {
    if (!staff) return;
    reset({
      name: staff.user.name,
      email: staff.user.email,
      password: "",
      position: staff.position ?? "",
      salary: staff.salary ?? undefined,
      subject: staff.subject ?? "",
      classId: staff.class?.id ?? null,
    });
    setIsPasswordEditable(false);
  }, [staff, reset]);

  // Fetch classes if needed and auto-select staff's class when available
  useEffect(() => {
    if (!requiresClassField) return;

    if (classList.length === 0) {
      setLoadingClasses(true);
      fetchClasses()
        .catch((err) => {
          console.error("Failed to fetch classes:", err);
          toast.error("Could not load classes");
        })
        .finally(() => setLoadingClasses(false));
    } else if (staff?.class?.id) {
      // set value only if form not modified by user (safe assumption here)
      setValue("classId", staff.class.id);
    }
  }, [requiresClassField, classList.length, fetchClasses, setValue, staff]);

  const positions = Object.keys(positionRoleMap);

  // Helper: try parse server error and map to fields
  function handleServerErrorPayload(errBody: any) {
    // errBody may be { error: "message" } or { error: { fieldErrors: {...}, formErrors: [] } } or { error: [ { path, message } ] }
    const payload = errBody?.error ?? errBody;

    // 1) string message
    if (typeof payload === "string") {
      return toast.error(payload);
    }

    // 2) zod.flatten() shape: { fieldErrors: { field: string[] }, formErrors: string[] }
    if (payload?.fieldErrors && typeof payload.fieldErrors === "object") {
      Object.entries(payload.fieldErrors).forEach(([field, messages]) => {
        if (Array.isArray(messages) && messages.length > 0) {
          setError(field as any, {
            type: "server",
            message: messages.join(", "),
          });
        }
      });
      if (Array.isArray(payload.formErrors) && payload.formErrors.length > 0) {
        return toast.error(payload.formErrors.join(", "));
      }
      return;
    }

    // 3) array of errors (zod .errors or similar)
    if (Array.isArray(payload)) {
      payload.forEach((item: any) => {
        // item may be { path: ['field'], message: '...' }
        if (
          item?.path &&
          Array.isArray(item.path) &&
          item.path.length > 0 &&
          item.message
        ) {
          setError(String(item.path[0]) as any, {
            type: "server",
            message: item.message,
          });
        }
      });
      return;
    }

    // 4) fallback: try to show useful message
    try {
      const text =
        typeof payload === "object" ? JSON.stringify(payload) : String(payload);
      return toast.error(text.slice(0, 200));
    } catch {
      return toast.error("Failed to update staff");
    }
  }

  const onSubmit: SubmitHandler<StaffFormValues> = async (data) => {
    setSubmitting(true);
    try {
      // Build minimal payload only for changed fields
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

      // Optimistic UI update — immediate UX. We still may set errors below if server fails.
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
        // parse server body and surface errors
        let errBody: any = null;
        try {
          errBody = await res.json();
        } catch (e) {
          console.error("Failed to parse error body", e);
        }
        console.error("Staff update failed:", errBody ?? res.statusText);
        handleServerErrorPayload(errBody ?? { error: res.statusText });
        throw new Error(errBody?.error ?? "Failed to update staff");
      }

      // Success — optionally parse returned staff
      const result = await res.json();
      toast.success("Staff updated successfully");
      onClose();
      return result;
    } catch (err: any) {
      // General fallback error
      console.error("Update failed:", err);
      if (!errors || Object.keys(errors).length === 0) {
        // if not field-level errors were set, show toast
        toast.error(err?.message ?? "Failed to update staff");
      }
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
            {errors.name && (
              <p className="text-red-600 text-sm">{errors.name.message}</p>
            )}
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
            {errors.email && (
              <p className="text-red-600 text-sm">{errors.email.message}</p>
            )}
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
                title={isPasswordEditable ? "Lock password" : "Unlock to edit"}
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

          {/* Salary */}
          <div>
            <label className="block text-sm font-medium mb-1">Salary</label>
            <input
              {...register("salary")}
              type="number"
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium mb-1">Subject</label>
            <input
              {...register("subject")}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {/* Class (conditional) */}
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
