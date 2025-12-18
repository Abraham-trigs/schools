"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import ExamsFormModal from "./components/ExamsFormModal.tsx";
import ConfirmDeleteExamModal from "./components/ConfirmDeleteExamModal.tsx";
import { useExamStore, Exam } from "@/app/store/examsStore.ts"; // make sure Exam type exists

export default function ExamsPage() {
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

  const [selectedExam, setSelectedExam] = useState<Exam | null>(null); // ✅ typed
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  useEffect(() => {
    fetchExams({ page, search });
  }, [page, search, fetchExams]);

  const handleDelete = async () => {
    if (!selectedExam?.id) return; // ✅ safety check
    await deleteExam(selectedExam.id);
    setIsDeleteOpen(false);
    setSelectedExam(null);
    fetchExams({ page, search });
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
    fetchExams({ page: 1, search: value });
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Exams</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Plus size={16} /> Add Exam
        </button>
      </header>

      {/* Search */}
      <div className="flex justify-end mb-4">
        <input
          type="text"
          placeholder="Search exams..."
          className="border p-2 rounded w-full md:w-1/2"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      {/* Loading / Error / Exams */}
      {loading ? (
        <div className="flex justify-center mt-10">
          <Loader2 className="animate-spin w-10 h-10 text-gray-400" />
        </div>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : exams.length === 0 ? (
        <p className="text-gray-500 italic">No exams found</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exams.map((exam) => (
            <div key={exam.id} className="bg-white p-4 shadow rounded">
              <h2 className="font-medium">{exam.subject}</h2>
              <p>Student: {exam.studentName}</p>
              <p>
                Score: {exam.score}/{exam.maxScore}
              </p>
              <div className="mt-2 flex gap-2">
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
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {exams.length > 0 && (
        <div className="flex justify-between mt-4">
          <button
            disabled={page <= 1}
            onClick={() => {
              setPage(page - 1);
              fetchExams({ page: page - 1, search });
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
              fetchExams({ page: page + 1, search });
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
          exam={selectedExam ?? undefined} // ✅ never null inside modal
          onClose={() => {
            setSelectedExam(null);
            setIsModalOpen(false);
            fetchExams({ page, search });
          }}
        />
      )}

      {isDeleteOpen && selectedExam && (
        <ConfirmDeleteExamModal
          exam={selectedExam}
          onClose={() => setIsDeleteOpen(false)}
          onConfirm={handleDelete} // ✅ safety check inside handler
        />
      )}
    </div>
  );
}
