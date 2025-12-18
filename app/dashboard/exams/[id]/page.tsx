"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import ExamsFormModal from "../components/ExamsFormModal.tsx";
import ConfirmDeleteExamModal from "../components/ConfirmDeleteExamModal.tsx";
import { useExamStore } from "@/app/store/examsStore.ts";

export default function StudentExamsPage() {
  const { id: studentId } = useParams();
  const {
    exams,
    total,
    loading,
    error,
    page,
    limit,
    search,
    fetchExams,
    setPage,
    setSearch,
    deleteExam,
  } = useExamStore();

  const [selectedExam, setSelectedExam] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Load exams on mount or when studentId changes
  useEffect(() => {
    fetchExams({ studentId });
  }, [studentId]);

  const handleDelete = async (examId: string) => {
    await deleteExam(examId);
    setIsDeleteOpen(false);
    fetchExams({ studentId, page }); // refresh current page
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
    fetchExams({ studentId, search: value, page: 1 });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Student Exams</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Plus size={16} /> Add Exam
        </button>
      </header>

      {/* Search Input */}
      <div className="flex justify-end mb-4">
        <input
          type="text"
          placeholder="Search exams..."
          className="border p-2 rounded w-full md:w-1/2"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      {/* Loading/Error */}
      {loading ? (
        <div className="flex justify-center mt-10">
          <Loader2 className="animate-spin w-10 h-10 text-gray-400" />
        </div>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : exams.length === 0 ? (
        <p className="text-gray-500 italic">
          No exams recorded for this student
        </p>
      ) : (
        <ul className="space-y-3">
          {exams.map((exam) => (
            <li
              key={exam.id}
              className="bg-white p-4 shadow rounded flex justify-between items-center"
            >
              <div>
                {exam.subject}: {exam.score}/{exam.maxScore}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedExam(exam);
                    setIsModalOpen(true);
                  }}
                  className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    setSelectedExam(exam);
                    setIsDeleteOpen(true);
                  }}
                  className="px-2 py-1 bg-red-100 text-red-800 rounded"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Pagination */}
      {exams.length > 0 && (
        <div className="flex justify-between mt-4">
          <button
            disabled={page <= 1}
            onClick={() => {
              setPage(page - 1);
              fetchExams({ studentId, page: page - 1 });
            }}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span>
            Page {page} / {Math.ceil(total / limit)}
          </span>
          <button
            disabled={page * limit >= total}
            onClick={() => {
              setPage(page + 1);
              fetchExams({ studentId, page: page + 1 });
            }}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Modals */}
      {isModalOpen && (
        <ExamsFormModal
          exam={selectedExam}
          studentId={studentId}
          onClose={() => {
            setSelectedExam(null);
            setIsModalOpen(false);
            fetchExams({ studentId, page });
          }}
        />
      )}

      {isDeleteOpen && selectedExam && (
        <ConfirmDeleteExamModal
          exam={selectedExam}
          onClose={() => setIsDeleteOpen(false)}
          onConfirm={() => handleDelete(selectedExam.id)}
        />
      )}
    </div>
  );
}
