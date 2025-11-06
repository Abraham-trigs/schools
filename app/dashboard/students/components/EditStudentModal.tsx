"use client";

import React, { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useStudentStore, StudentDetail } from "@/app/store/useStudentStore";
import { useClassesStore } from "@/app/store/useClassesStore";

interface EditStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentDetail;
  onUpdate?: (data: Partial<StudentDetail>) => void; // optional callback for parent
}

const studentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().optional(),
  classId: z.string().nullable().optional(),
});

type StudentFormValues = z.infer<typeof studentSchema>;

export default function EditStudentModal({
  isOpen,
  onClose,
  student,
  onUpdate,
}: EditStudentModalProps) {
  const { updateStudent, replaceStudent } = useStudentStore();
  const classList = useClassesStore((s) => s.classes);
  const fetchClasses = useClassesStore((s) => s.fetchClasses);

  const [isPasswordEditable, setIsPasswordEditable] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: { name: "", email: "", password: "", classId: null },
  });

  useEffect(() => {
    if (!student || classList.length === 0) return;
    reset({
      name: student.user?.name ?? student.name,
      email: student.user?.email ?? student.email,
      classId: student.class?.id ?? null,
      password: "",
    });
    setIsPasswordEditable(false);
  }, [student, classList, reset]);

  useEffect(() => {
    if (classList.length === 0) fetchClasses().catch(() => {});
  }, [classList.length, fetchClasses]);

  const onSubmit: SubmitHandler<StudentFormValues> = async (data) => {
    if (!student) return;

    const payload: Partial<StudentDetail> & { classId?: string | null } = {};
    if (data.name !== (student.user?.name ?? student.name))
      payload.name = data.name.trim();
    if (data.email !== (student.user?.email ?? student.email))
      payload.email = data.email.trim();
    if (isPasswordEditable && data.password?.trim())
      payload.password = data.password.trim();
    if (data.classId !== student.class?.id)
      payload.classId = data.classId || null;

    if (Object.keys(payload).length === 0) return;

    // Optimistic update
    const updatedStudent: StudentDetail = {
      ...student,
      user: {
        ...student.user,
        name: payload.name ?? student.user?.name,
        email: payload.email ?? student.user?.email,
      },
      class: classList.find((c) => c.id === payload.classId) ?? student.class,
    };
    replaceStudent(student.id, updatedStudent);

    setLoading(true);
    try {
      await updateStudent(student.id, payload);
      if (onUpdate) onUpdate(payload); // notify parent page
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative bg-white rounded-lg shadow-lg w-full max-w-md mx-4 p-6 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-3">Edit Student</h3>
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
                disabled={!isPasswordEditable || loading}
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
                {isPasswordEditable ? "Lock" : "Unlock"}
              </button>
            </div>
          </div>

          {/* Class */}
          <div>
            <label className="block text-sm font-medium mb-1">Class</label>
            <select
              {...register("classId")}
              className="w-full border rounded px-3 py-2"
              disabled={loading || classList.length === 0}
            >
              <option value="">
                {loading ? "Updating..." : "Select class"}
              </option>
              {classList.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border rounded hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {loading ? "Updating..." : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
