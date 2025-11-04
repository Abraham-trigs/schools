"use client";

import React, { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useStudentStore, StudentDetail } from "@/app/store/useStudentStore";
import { useClassesStore } from "@/app/store/useClassesStore";
import { toast } from "sonner";
import ConfirmDeleteModal from "@/app/dashboard/staff/components/ConfirmDeleteModal.tsx"; // ✅ Import reusable modal

interface EditStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentDetail;
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
}: EditStudentModalProps) {
  const updateStudent = useStudentStore((s) => s.updateStudent);
  const replaceStudent = useStudentStore((s) => s.replaceStudent);
  const deleteStudent = useStudentStore((s) => s.deleteStudent);

  const classList = useClassesStore((s) => s.classes);
  const fetchClasses = useClassesStore((s) => s.fetchClasses);

  const [submitting, setSubmitting] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [isPasswordEditable, setIsPasswordEditable] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors },
  } = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: { name: "", email: "", password: "", classId: null },
  });

  const classId = watch("classId");

  // Prefill form when modal opens
  useEffect(() => {
    if (!student) return;
    reset({
      name: student.name,
      email: student.email,
      classId: student.class?.id ?? null,
      password: "",
    });
    setIsPasswordEditable(false);
  }, [student, reset]);

  // Fetch classes if empty
  useEffect(() => {
    if (classList.length === 0) {
      setLoadingClasses(true);
      fetchClasses()
        .catch(() => toast.error("Failed to load classes"))
        .finally(() => setLoadingClasses(false));
    }
  }, [classList.length, fetchClasses]);

  const onSubmit: SubmitHandler<StudentFormValues> = async (data) => {
    setSubmitting(true);
    try {
      const payload: Partial<StudentDetail> & { classId?: string | null } = {};

      if (data.name !== student.name) payload.name = data.name.trim();
      if (data.email !== student.email) payload.email = data.email.trim();
      if (isPasswordEditable && data.password?.trim())
        payload.password = data.password.trim();
      if (data.classId !== student.class?.id)
        payload.classId = data.classId || null;

      if (Object.keys(payload).length === 0) {
        toast.info("No changes to update");
        setSubmitting(false);
        return;
      }

      // Optimistic update
      const updatedStudent: StudentDetail = { ...student, ...payload };
      replaceStudent(student.id, updatedStudent);

      await updateStudent(student.id, payload);

      toast.success(`Student "${updatedStudent.name}" updated successfully`);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError("name", {
        type: "manual",
        message: err?.response?.data?.error || err?.message || "Update failed",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Trigger delete modal
  const handleDeleteClick = () => setShowDeleteModal(true);
  const handleDeleteClose = () => setShowDeleteModal(false);
  const handleDeleteConfirm = async () => {
    try {
      await deleteStudent(student.id);
      toast.success(`Student "${student.name}" deleted successfully`);
      setShowDeleteModal(false);
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to delete student");
    }
  };

  if (!isOpen) return null;

  return (
    <>
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
          <h3 className="text-lg font-semibold mb-3">Edit Student</h3>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-3"
            noValidate
          >
            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Full name
              </label>
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

            {/* Actions */}
            <div className="flex justify-between gap-2 mt-4">
              <button
                type="button"
                onClick={handleDeleteClick}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
              <div className="flex gap-2">
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
            </div>
          </form>
        </div>
      </div>

      {/* Reusable Delete Modal */}
      {showDeleteModal && (
        <ConfirmDeleteModal
          isOpen={showDeleteModal}
          staff={student as any} // Temporarily cast as staff-like for modal reuse
          onClose={handleDeleteClose}
        />
      )}
    </>
  );
}
