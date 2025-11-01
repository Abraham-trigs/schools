"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { z } from "zod";
import { toast } from "react-hot-toast";

interface Parent {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface Exam {
  id: string;
  subject: string;
  score: number;
  maxScore: number;
  date: string;
}

interface Transaction {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  description?: string;
  date: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface Student {
  id: string;
  enrolledAt: string;
  user: User;
  parents: Parent[];
  exams: Exam[];
  transactions: Transaction[];
}

interface ModalProps {
  studentId: string | null;
  classId: string;
  schoolId: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

const studentUpdateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

export default function StudentModal({
  studentId,
  classId,
  schoolId,
  isOpen,
  onClose,
  onUpdate,
}: ModalProps) {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "" });

  const fetchStudent = async () => {
    if (!studentId) return;
    try {
      setLoading(true);
      const res = await axios.get(
        `/api/classes/${classId}/school/${schoolId}?studentId=${studentId}`,
        {
          withCredentials: true,
        }
      );
      setStudent(res.data);
      setFormData({ name: res.data.user.name, email: res.data.user.email });
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to fetch student");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      const parsed = studentUpdateSchema.parse(formData);
      await axios.patch(
        `/api/classes/${classId}/school/${schoolId}`,
        {
          ...parsed,
          id: studentId,
        },
        { withCredentials: true }
      );
      toast.success("Student updated successfully");
      setEditMode(false);
      fetchStudent();
      onUpdate?.();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update student");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this student?")) return;
    try {
      await axios.delete(`/api/classes/${classId}/school/${schoolId}`, {
        params: { id: studentId },
        withCredentials: true,
      });
      toast.success("Student deleted successfully");
      onUpdate?.();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to delete student");
    }
  };

  useEffect(() => {
    if (isOpen && studentId) fetchStudent();
    else setStudent(null);
  }, [isOpen, studentId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-11/12 max-w-3xl p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Student Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {loading || !student ? (
          <p>Loading...</p>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium">Name</label>
                {editMode ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full border px-2 py-1 rounded"
                  />
                ) : (
                  <p>{student.user.name}</p>
                )}
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium">Email</label>
                {editMode ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full border px-2 py-1 rounded"
                  />
                ) : (
                  <p>{student.user.email}</p>
                )}
              </div>
            </div>

            <p>
              Enrolled At: {new Date(student.enrolledAt).toLocaleDateString()}
            </p>

            <div>
              <h3 className="font-medium">Parents</h3>
              {student.parents.length === 0 ? (
                <p>No parents recorded.</p>
              ) : (
                <ul className="list-disc pl-5">
                  {student.parents.map((p) => (
                    <li key={p.id}>
                      {p.name} - {p.email}
                      {p.phone ? ` (${p.phone})` : ""}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h3 className="font-medium">Exams</h3>
              {student.exams.length === 0 ? (
                <p>No exams recorded.</p>
              ) : (
                <ul className="list-disc pl-5">
                  {student.exams.map((e) => (
                    <li key={e.id}>
                      {e.subject}: {e.score}/{e.maxScore} (
                      {new Date(e.date).toLocaleDateString()})
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h3 className="font-medium">Transactions</h3>
              {student.transactions.length === 0 ? (
                <p>No transactions recorded.</p>
              ) : (
                <ul className="list-disc pl-5">
                  {student.transactions.map((t) => (
                    <li key={t.id}>
                      {t.type} - {t.amount} (
                      {new Date(t.date).toLocaleDateString()}){" "}
                      {t.description && `- ${t.description}`}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-4">
              {editMode ? (
                <>
                  <button
                    onClick={handleUpdate}
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditMode(false)}
                    className="px-4 py-2 border rounded"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setEditMode(true)}
                    className="px-4 py-2 border rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 border rounded text-red-600"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
