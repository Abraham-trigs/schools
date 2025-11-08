// app/dashboard/classes/components/StudentsModal.tsx
// Purpose: Modal displaying students of a class with search, highlighting, pagination, and full keyboard accessibility

"use client";

import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { useEffect, useRef, useState } from "react";
import { useStudentStore } from "@/app/store/useStudentStore.ts";
import { useRouter } from "next/navigation";

// ---------------------------
// Props interface
// ---------------------------
interface StudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  className: string;
}

// ---------------------------
// Component
// ---------------------------
export default function StudentsModal({
  isOpen,
  onClose,
  classId,
  className,
}: StudentsModalProps) {
  const router = useRouter();

  // Zustand store for students
  const {
    students,
    loading,
    fetchStudents,
    setSearch,
    search: storeSearch,
    page,
    perPage,
  } = useStudentStore();

  const [localSearch, setLocalSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0); // Index of highlighted student
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listContainerRef = useRef<HTMLUListElement>(null);

  // ---------------------------
  // Fetch students when modal opens or classId changes
  // ---------------------------
  useEffect(() => {
    if (isOpen && classId) {
      fetchStudents(1, perPage, "", classId);
      setHighlightedIndex(0); // Reset highlight
      setLocalSearch(""); // Reset local search
    }
  }, [isOpen, classId, perPage, fetchStudents]);

  // ---------------------------
  // Auto-focus search input when modal opens
  // ---------------------------
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // ---------------------------
  // Debounced search
  // Store handles debounce
  // ---------------------------
  useEffect(() => {
    if (!classId) return;
    setSearch(localSearch, classId);
  }, [localSearch, classId, setSearch]);

  // ---------------------------
  // Normalize string for highlighting
  // ---------------------------
  const normalize = (str: string) =>
    str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  // ---------------------------
  // Highlight matches in student names
  // ---------------------------
  const highlightMatches = (name: string) => {
    const term = normalize(storeSearch.trim());
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

  // ---------------------------
  // Keyboard navigation handler
  // ---------------------------
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!students || students.length === 0) return;

    switch (e.key) {
      case "Escape":
        e.preventDefault();
        onClose();
        break;
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < students.length - 1 ? prev + 1 : prev
        );
        scrollToHighlighted(highlightedIndex + 1);
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        scrollToHighlighted(highlightedIndex - 1);
        break;
      case "Enter":
        e.preventDefault();
        const selected = students[highlightedIndex];
        if (selected) {
          const studentId = selected.studentId ?? selected.id;
          router.push(`/dashboard/students/${studentId}`);
          onClose();
        }
        break;
      case "Home":
        e.preventDefault();
        setHighlightedIndex(0);
        scrollToHighlighted(0);
        break;
      case "End":
        e.preventDefault();
        setHighlightedIndex(students.length - 1);
        scrollToHighlighted(students.length - 1);
        break;
      default:
        break;
    }
  };

  // ---------------------------
  // Scroll highlighted student into view
  // ---------------------------
  const scrollToHighlighted = (index: number) => {
    const container = listContainerRef.current;
    if (!container) return;
    const item = container.children[index] as HTMLElement;
    if (item) item.scrollIntoView({ block: "nearest" });
  };

  // ---------------------------
  // Do not render modal if closed
  // ---------------------------
  if (!isOpen) return null;

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-50"
      onKeyDown={handleKeyDown} // global keyboard handling
    >
      <DialogBackdrop className="fixed inset-0 bg-black/40 backdrop-blur-sm" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
          {/* Header */}
          <DialogTitle className="text-xl font-semibold mb-4">
            <span className="font-light">Students of</span> {className}
          </DialogTitle>

          {/* Search input */}
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search students..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-ford-primary"
          />

          {/* Student list or loading/empty states */}
          {loading ? (
            <p className="text-gray-500 text-center">Loading...</p>
          ) : students.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No students in this class
            </p>
          ) : (
            <ul
              ref={listContainerRef}
              className="space-y-2 max-h-64 overflow-y-auto"
            >
              {students.map((s, idx) => {
                const isHighlighted = idx === highlightedIndex;
                return (
                  <li
                    key={s.id}
                    className={`px-2 py-1 border rounded cursor-pointer hover:bg-gray-100 ${
                      isHighlighted ? "bg-gray-200" : ""
                    }`}
                    onMouseEnter={() => setHighlightedIndex(idx)}
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
                );
              })}
            </ul>
          )}

          {/* Close button */}
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

/* Integration notes:
- Parent page usage:
  <StudentsModal
    isOpen={studentsOpen}
    onClose={() => setStudentsOpen(false)}
    classId={currentClass.id}
    className={currentClass.name}
  />
- Store methods fetchStudents/setSearch must respect classId parameter.
- Keyboard: ArrowUp/Down navigate, Enter selects, Esc closes, Home/End jump.
*/

/* Design reasoning →
- Auto-focus search improves UX.
- Keyboard navigation + highlight gives accessibility and efficiency.
- ScrollIntoView keeps highlighted row visible.
- Empty/loading states handled gracefully.
*/

/* Structure →
- Props: isOpen, onClose, classId, className
- State: localSearch, highlightedIndex
- Refs: searchInputRef, listContainerRef
- Store: students, loading, fetchStudents, setSearch
- Handlers: highlightMatches, handleKeyDown, scrollToHighlighted
- Returns: Dialog with input, list, states, close button
*/

/* Implementation guidance →
- Ready to drop into page.
- Store returns student array with {id, studentId?, user:{name}}.
- Keyboard events enhance accessibility.
*/

/* Scalability insight →
- Pagination or infinite scroll easily added.
- Highlighting function can be reused for other searchable lists.
- Extend keyboard to support multi-select if needed.
*/
