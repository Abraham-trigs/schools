// src/components/UserStaffForm.tsx
// Purpose: Unified User + Staff form with optional staff fields (position, department, salary, hireDate), fully production-ready and reusable.

"use client";

import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { userCreateSchema, staffRoles } from "@/lib/validation/userSchemas.ts";
import { useUserStore } from "../../store/useUserStore.ts";
import { z } from "zod";

// ------------------- Types -------------------
const staffFieldsSchema = z.object({
  position: z.string().optional().nullable(),
  departmentId: z.string().optional().nullable(),
  salary: z.preprocess(
    (val) => (val === "" ? null : Number(val)),
    z.number().nullable()
  ),
  hireDate: z.preprocess(
    (val) => (val ? new Date(val).toISOString() : null),
    z.string().nullable()
  ),
});

const unifiedSchema = userCreateSchema.merge(staffFieldsSchema);
type UnifiedFormData = z.infer<typeof unifiedSchema>;

interface UserStaffFormProps {
  defaultValues?: Partial<UnifiedFormData>;
  onSuccess?: (user: UnifiedFormData) => void;
  submitLabel?: string;
}

// ------------------- Reusable Button Component -------------------
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  loading,
  ...props
}) => (
  <button
    {...props}
    disabled={loading || props.disabled}
    className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition"
  >
    {loading ? "Processing..." : children}
  </button>
);

// ------------------- Unified User + Staff Form -------------------
export const UserStaffForm: React.FC<UserStaffFormProps> = ({
  defaultValues,
  onSuccess,
  submitLabel,
}) => {
  const { createUser, updateUser } = useUserStore();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UnifiedFormData>({
    resolver: zodResolver(unifiedSchema),
    defaultValues,
  });

  const watchedRole = watch("role");

  const onSubmit = async (data: UnifiedFormData) => {
    try {
      let result;
      if (defaultValues?.id) {
        result = await updateUser(defaultValues.id, data);
      } else {
        result = await createUser(data);
      }
      reset(result);
      if (onSuccess) onSuccess(result);
    } catch (err) {
      console.error("Form submission error:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Basic User Fields */}
      <div>
        <label className="block font-semibold">Name</label>
        <input
          {...register("name")}
          className="w-full border px-3 py-2 rounded"
          placeholder="Full Name"
        />
        {errors.name && <p className="text-red-500">{errors.name.message}</p>}
      </div>

      <div>
        <label className="block font-semibold">Email</label>
        <input
          {...register("email")}
          className="w-full border px-3 py-2 rounded"
          placeholder="Email"
        />
        {errors.email && <p className="text-red-500">{errors.email.message}</p>}
      </div>

      {!defaultValues?.id && (
        <div>
          <label className="block font-semibold">Password</label>
          <input
            type="password"
            {...register("password")}
            className="w-full border px-3 py-2 rounded"
            placeholder="Password"
          />
          {errors.password && (
            <p className="text-red-500">{errors.password.message}</p>
          )}
        </div>
      )}

      <div>
        <label className="block font-semibold">Role</label>
        <select
          {...register("role")}
          className="w-full border px-3 py-2 rounded"
        >
          <option value="">Select Role</option>
          {staffRoles.map((role) => (
            <option key={role} value={role}>
              {role.replace("_", " ")}
            </option>
          ))}
        </select>
        {errors.role && <p className="text-red-500">{errors.role.message}</p>}
      </div>

      {watchedRole === "TRANSPORT" && (
        <div>
          <label className="block font-semibold">Bus ID</label>
          <input
            {...register("busId")}
            className="w-full border px-3 py-2 rounded"
            placeholder="Bus ID"
          />
          {errors.busId && (
            <p className="text-red-500">{errors.busId.message}</p>
          )}
        </div>
      )}

      {/* Optional Staff Fields */}
      {staffRoles.includes(watchedRole) && (
        <>
          <div>
            <label className="block font-semibold">Position</label>
            <input
              {...register("position")}
              className="w-full border px-3 py-2 rounded"
              placeholder="Position"
            />
            {errors.position && (
              <p className="text-red-500">{errors.position.message}</p>
            )}
          </div>

          <div>
            <label className="block font-semibold">Department ID</label>
            <input
              {...register("departmentId")}
              className="w-full border px-3 py-2 rounded"
              placeholder="Department ID"
            />
            {errors.departmentId && (
              <p className="text-red-500">{errors.departmentId.message}</p>
            )}
          </div>

          <div>
            <label className="block font-semibold">Salary</label>
            <input
              type="number"
              {...register("salary")}
              className="w-full border px-3 py-2 rounded"
              placeholder="Salary"
            />
            {errors.salary && (
              <p className="text-red-500">{errors.salary.message}</p>
            )}
          </div>

          <div>
            <label className="block font-semibold">Hire Date</label>
            <input
              type="date"
              {...register("hireDate")}
              className="w-full border px-3 py-2 rounded"
            />
            {errors.hireDate && (
              <p className="text-red-500">{errors.hireDate.message}</p>
            )}
          </div>
        </>
      )}

      <Button type="submit" loading={isSubmitting}>
        {submitLabel || (defaultValues?.id ? "Update User" : "Create User")}
      </Button>
    </form>
  );
};

// ------------------- Implementation guidance -------------------
// import { UserStaffForm } from "@/components/UserStaffForm";
// <UserStaffForm onSuccess={(user) => console.log("Created/Updated", user)} />

// ------------------- Scalability insight -------------------
// - Can add classId, subject assignments, or attendance info for staff dynamically.
// - Supports create/edit seamlessly, with optional staff fields appearing only when relevant.
// - Reusable Button ensures consistent UX across all forms.
