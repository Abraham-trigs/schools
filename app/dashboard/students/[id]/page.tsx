"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";
import { useStudentStore } from "@/app/store/useStudentStore";

// Client-safe AttendancesStatus enum
const AttendancesStatus = {
  PRESENT: "PRESENT",
  ABSENT: "ABSENT",
  LATE: "LATE",
  EXCUSED: "EXCUSED",
} as const;

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id;

  const { student, loading, error, fetchStudent } = useStudentStore();

  // Fetch the student when page loads
  useEffect(() => {
    if (studentId) fetchStudent(studentId);
  }, [studentId, fetchStudent]);

  if (loading)
    return (
      <div className="flex justify-center mt-10">
        <Loader2 className="animate-spin w-10 h-10 text-gray-400" />
      </div>
    );

  if (error)
    return (
      <div className="text-red-500 mt-6 text-center">
        {error || "Failed to fetch student"}
      </div>
    );

  if (!student)
    return <div className="text-center mt-6">Student not found</div>;

  const data = student;

  // Attendance summary
  const summary = Object.values(AttendancesStatus).reduce(
    (acc, status) => {
      const count =
        data.attendances?.filter((a) => a.status === status).length ?? 0;
      acc[status.toLowerCase()] = count;
      acc.total += count;
      return acc;
    },
    { total: 0 } as Record<string, number>
  );

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-ford-primary hover:underline"
      >
        <ArrowLeft className="w-5 h-5" /> Back to Students
      </button>

      {/* Student Info Card */}
      <div className="bg-white shadow rounded-lg p-6 space-y-4">
        <h1 className="text-2xl font-semibold">{data.name}</h1>
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <span className="font-medium">Email:</span> {data.email}
          </div>
          <div>
            <span className="font-medium">Class:</span>{" "}
            {data.class?.name ?? "—"}
          </div>
          <div>
            <span className="font-medium">Enrolled:</span>{" "}
            {data.enrolledAt
              ? new Date(data.enrolledAt).toLocaleDateString()
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
        {data.parents?.length ? (
          <ul className="list-disc list-inside text-gray-700">
            {data.parents.map((p) => (
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
        {data.exams?.length ? (
          <ul className="list-disc list-inside text-gray-700">
            {data.exams.map((e, idx) => (
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
        {data.transactions?.length ? (
          <ul className="list-disc list-inside text-gray-700">
            {data.transactions.map((t, idx) => (
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
    </div>
  );
}
