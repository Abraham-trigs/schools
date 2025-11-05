"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Edit, Trash2 } from "lucide-react";
import { useStudentStore, StudentDetail } from "@/app/store/useStudentStore";
import ConfirmDeleteModal from "@/app/dashboard/students/components/ConfirmDeleteModal.tsx";
import EditStudentModal from "../components/EditStudentModal";

const AttendancesStatus = {
  PRESENT: "PRESENT",
  ABSENT: "ABSENT",
  LATE: "LATE",
  EXCUSED: "EXCUSED",
} as const;

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params?.id;

  const {
    student,
    loading,
    error,
    fetchStudent,
    updateStudent,
    deleteStudent,
  } = useStudentStore();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch student on load
  useEffect(() => {
    if (!studentId) return;
    fetchStudent(studentId);
  }, [studentId, fetchStudent]);

  const handleEdit = () => setIsEditOpen(true);
  const handleDelete = () => setIsDeleteOpen(true);
  const closeEdit = () => setIsEditOpen(false);
  const closeDelete = () => setIsDeleteOpen(false);

  const handleDeleteConfirmed = async () => {
    if (!student) return;
    setIsDeleting(true);
    try {
      await deleteStudent(student.id);
      router.replace("/dashboard/students");
    } catch (err) {
      // notify handled in store
    } finally {
      setIsDeleting(false);
      closeDelete();
    }
  };

  const handleUpdate = async (data: Partial<StudentDetail>) => {
    if (!student) return;
    try {
      await updateStudent(student.id, data);
    } catch (err) {
      // notify handled in store
    } finally {
      closeEdit();
    }
  };

  // --- Render states ---
  if (!studentId)
    return (
      <div className="text-center mt-6 text-red-500">
        No student ID provided
      </div>
    );

  if (loading)
    return (
      <div className="flex justify-center mt-10">
        <Loader2 className="animate-spin w-10 h-10 text-gray-400" />
      </div>
    );

  if (error)
    return <div className="text-red-500 mt-6 text-center">{error}</div>;

  if (!student)
    return (
      <div className="text-center mt-6 text-gray-500">Student not found</div>
    );

  const summary =
    student.attendancesSummary ||
    Object.values(AttendancesStatus).reduce(
      (acc, status) => {
        const count =
          student.attendances?.filter((a) => a.status === status).length ?? 0;
        acc[status.toLowerCase()] = count;
        acc.total += count;
        return acc;
      },
      { total: 0 } as Record<string, number>
    );

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <header className="flex justify-between items-center flex-wrap gap-3">
        <button
          onClick={() => router.push("/dashboard/students")}
          className="flex items-center gap-2 text-ford-primary hover:underline"
        >
          <ArrowLeft className="w-5 h-5" /> Back to Students
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={handleEdit}
            className="flex items-center gap-1 px-3 py-1 border border-blue-500 text-blue-600 rounded hover:bg-blue-50 focus:ring-2 focus:ring-blue-400 transition"
          >
            <Edit size={16} /> Edit
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-1 px-3 py-1 border border-red-500 text-red-600 rounded hover:bg-red-50 focus:ring-2 focus:ring-red-400 transition"
          >
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </header>

      {/* Student Info */}
      <div className="bg-white shadow rounded-lg p-6 space-y-4">
        <h1 className="text-2xl font-semibold">{student.name}</h1>
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <span className="font-medium">Email:</span> {student.email}
          </div>
          <div>
            <span className="font-medium">Class:</span>{" "}
            {student.class?.name ?? "—"}
          </div>
          <div>
            <span className="font-medium">Enrolled:</span>{" "}
            {student.enrolledAt
              ? new Date(student.enrolledAt).toLocaleDateString()
              : "—"}
          </div>
        </div>
      </div>

      {/* Attendance Summary */}
      <div className="bg-white shadow rounded-lg p-6 grid grid-cols-5 text-center text-gray-700">
        <div>
          <span className="font-medium block">Total</span>
          {summary.total}
        </div>
        {Object.values(AttendancesStatus).map((status) => (
          <div key={status}>
            <span className="font-medium block">{status}</span>
            {summary[status.toLowerCase()] ?? 0}
          </div>
        ))}
      </div>

      {/* Parents */}
      <div className="bg-white shadow rounded-lg p-6 space-y-2">
        <h2 className="text-xl font-medium">Parents</h2>
        {student.parents?.length ? (
          <ul className="list-disc list-inside text-gray-700">
            {student.parents.map((p) => (
              <li key={p.email}>
                {p.name} — {p.email} {p.phone ? `— ${p.phone}` : ""}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 italic">No parents recorded</p>
        )}
      </div>

      {/* Exams */}
      <div className="bg-white shadow rounded-lg p-6 space-y-2">
        <h2 className="text-xl font-medium">Exams</h2>
        {student.exams?.length ? (
          <ul className="list-disc list-inside text-gray-700">
            {student.exams.map((e, idx) => (
              <li key={idx}>
                {e.subject}: {e.score}/{e.maxScore}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 italic">No exams recorded</p>
        )}
      </div>

      {/* Transactions */}
      <div className="bg-white shadow rounded-lg p-6 space-y-2">
        <h2 className="text-xl font-medium">Transactions</h2>
        {student.transactions?.length ? (
          <ul className="list-disc list-inside text-gray-700">
            {student.transactions.map((t, idx) => (
              <li key={idx}>
                {t.type} — {t.amount} — {t.description ?? "-"} —{" "}
                {new Date(t.date).toLocaleDateString()}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 italic">No transactions recorded</p>
        )}
      </div>

      {/* Modals */}
      {isEditOpen && student && (
        <EditStudentModal
          isOpen={isEditOpen}
          onClose={closeEdit}
          student={student}
          onUpdate={handleUpdate}
        />
      )}
      {isDeleteOpen && student && (
        <ConfirmDeleteModal
          isOpen={isDeleteOpen}
          student={student}
          onClose={closeDelete}
          onConfirm={handleDeleteConfirmed}
          loading={isDeleting}
        />
      )}
    </div>
  );
}
