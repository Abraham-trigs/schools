// app/classes/components/StudentsModal.tsx
"use client";

import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { useState, useEffect, useMemo } from "react";
import { useClassesStore } from "@/app/store/useClassesStore";
import { useRouter } from "next/navigation";

interface StudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  className: string;
}

export default function StudentsModal({
  isOpen,
  onClose,
  classId,
  className,
}: StudentsModalProps) {
  const { fetchStudents, students, loading } = useClassesStore();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const router = useRouter();

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch students when modal opens
  useEffect(() => {
    if (isOpen && classId) fetchStudents(classId);
  }, [isOpen, classId, fetchStudents]);

  const normalize = (str: string) =>
    str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  const filteredStudents = useMemo(() => {
    const term = normalize(debouncedSearch.trim());
    if (!term) return students.filter((s) => s.user?.name);
    return students.filter((s) => normalize(s.user?.name ?? "").includes(term));
  }, [students, debouncedSearch]);

  const highlightMatches = (name: string) => {
    const term = normalize(debouncedSearch.trim());
    if (!term) return name;

    const normalizedName = normalize(name);
    const result: JSX.Element[] = [];
    let lastIndex = 0;
    const regex = new RegExp(term, "gi");
    let match;

    while ((match = regex.exec(normalizedName)) !== null) {
      const start = match.index;
      const end = start + match[0].length;

      if (start > lastIndex)
        result.push(
          <span key={lastIndex}>{name.slice(lastIndex, start)}</span>
        );

      result.push(
        <span key={start} className="bg-yellow-200">
          {name.slice(start, end)}
        </span>
      );

      lastIndex = end;
    }

    if (lastIndex < name.length)
      result.push(<span key={lastIndex}>{name.slice(lastIndex)}</span>);

    return result;
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
          <DialogTitle className="text-xl font-semibold mb-4">
            Students in {className}
          </DialogTitle>

          <input
            type="text"
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-ford-primary"
          />

          {loading ? (
            <p className="text-gray-500 text-center">Loading...</p>
          ) : students.length === 0 ? (
            <p className="text-gray-500 text-center">
              No students enrolled in this class yet.
            </p>
          ) : filteredStudents.length === 0 ? (
            <p className="text-gray-500 text-center">
              No students match your search.
            </p>
          ) : (
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {filteredStudents.map((s) => (
                <li
                  key={s.id}
                  className="px-2 py-1 border rounded cursor-pointer hover:bg-gray-100"
                  onClick={() => {
                    const studentId = s.studentId ?? s.id;
                    router.push(`/dashboard/students/${studentId}`);
                    onClose();
                  }}
                >
                  {s.user?.name
                    ? highlightMatches(s.user.name)
                    : "Unnamed Student"}
                </li>
              ))}
            </ul>
          )}

          <button
            onClick={onClose}
            className="mt-6 w-full px-4 py-2 rounded-lg bg-ford-primary text-white hover:bg-ford-secondary transition"
          >
            Close
          </button>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
