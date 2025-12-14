"use client";

import { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import { X } from "lucide-react";
import { useExamStore, Exam } from "@/app/store/examsStore.ts";

interface ExamsFormModalProps {
  isOpen?: boolean;
  exam?: Exam | null;
  studentId: string;
  onClose: () => void;
}

export default function ExamsFormModal({
  isOpen = true,
  exam,
  studentId,
  onClose,
}: ExamsFormModalProps) {
  const [subject, setSubject] = useState("");
  const [score, setScore] = useState<number | "">("");
  const [maxScore, setMaxScore] = useState<number | "">("");

  const { createExam, updateExam } = useExamStore();

  // Load exam data safely
  useEffect(() => {
    if (exam) {
      setSubject(exam.subject ?? "");
      setScore(exam.score ?? "");
      setMaxScore(exam.maxScore ?? "");
    } else {
      setSubject("");
      setScore("");
      setMaxScore("");
    }
  }, [exam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!studentId) {
      console.error("Student ID is required");
      return;
    }

    const data = {
      subject: subject.trim(),
      score: typeof score === "number" ? score : 0,
      maxScore: typeof maxScore === "number" ? maxScore : 0,
      studentId,
    };

    try {
      if (exam?.id) {
        await updateExam(exam.id, data);
      } else {
        await createExam(data);
      }
      onClose();
    } catch (err: any) {
      console.error("Failed to save exam:", err.message ?? err);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
    >
      <Dialog.Panel className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <Dialog.Title className="text-lg font-medium">
            {exam ? "Edit Exam" : "Add Exam"}
          </Dialog.Title>
          <button onClick={onClose}>
            <X />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1 w-full border rounded px-2 py-1"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Score</label>
            <input
              type="number"
              value={score}
              onChange={(e) =>
                setScore(e.target.value === "" ? "" : Number(e.target.value))
              }
              className="mt-1 w-full border rounded px-2 py-1"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Max Score</label>
            <input
              type="number"
              value={maxScore}
              onChange={(e) =>
                setMaxScore(e.target.value === "" ? "" : Number(e.target.value))
              }
              className="mt-1 w-full border rounded px-2 py-1"
              required
            />
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {exam ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </Dialog.Panel>
    </Dialog>
  );
}
