// src/stores/useStudentStore.ts
// Purpose: Zustand store for managing students scoped to authenticated user's school and class, with full CRUD, pagination, search, sorting, caching, and optimistic UI

"use client";

import { create } from "zustand";
import { debounce } from "lodash";
import { apiClient } from "@lib/apiClient.ts";
import { notify } from "@lib/helpers/notifications.ts";
import { useClassesStore } from "./useClassesStore";

/**
 * Types
 */
export interface Attendance {
  id: string;
  studentId: string;
  date: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  timeIn?: string | null;
  timeOut?: string | null;
  remarks?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StudentDetail {
  id: string;
  name: string;
  email: string;
  studentId: string;
  class?: { id: string; name: string } | null;
  enrolledAt?: string | null;
  parents: any[];
  exams: any[];
  transactions: any[];
  attendances: Attendance[];
  attendancesSummary?: Record<string, number>;
  user?: { id: string; name: string; email: string }; // optional for optimistic UI
}

/**
 * Store interface
 */
interface StudentStore {
  student: StudentDetail | null;
  students: StudentDetail[];
  total: number;
  page: number;
  perPage: number;
  loading: boolean;
  error: string | null;
  search: string;
  sortBy: "name" | "email" | "createdAt";
  sortOrder: "asc" | "desc";
  cache: Record<string, StudentDetail[]>;

  fetchStudent: (id: string) => Promise<void>;
  fetchStudents: (page?: number, perPage?: number, search?: string, classId?: string) => Promise<void>;
  clearStudent: () => void;
  setSearch: (search: string, classId?: string) => void;
  setSort: (sortBy: "name" | "email" | "createdAt", sortOrder: "asc" | "desc", classId?: string) => void;
  setPage: (page: number, classId?: string) => void;

  addStudent: (student: StudentDetail) => void;
  replaceStudent: (oldId: string, newStudent: StudentDetail) => void;
  removeStudent: (id: string) => void;

  addStudentAsync: (studentData: { name: string; email: string; password?: string; classId: string }) => Promise<void>;
  updateStudent: (id: string, data: Partial<StudentDetail> & { classId?: string | null }) => Promise<void>;
  deleteStudent: (id: string, classId?: string) => Promise<void>;
}

/**
 * Implementation
 */
export const useStudentStore = create<StudentStore>((set, get) => {
  // Debounce search with optional class filter to avoid rapid API requests.
  const debouncedFetch = debounce((search: string, classId?: string) => get().fetchStudents(1, get().perPage, search, classId), 400);

  return {
    // ---------------------------
    // Initial state
    // ---------------------------
    student: null,
    students: [],
    total: 0,
    page: 1,
    perPage: 10,
    loading: false,
    error: null,
    search: "",
    sortBy: "name",
    sortOrder: "asc",
    cache: {},

    // ---------------------------
    // Fetch students (optionally scoped by classId)
    // ---------------------------
    fetchStudents: async (page = get().page, perPage = get().perPage, search = get().search, classId?: string) => {
      // set loading + clear previous error
      set({ loading: true, error: null });
      const { sortBy, sortOrder, cache } = get();
      const cacheKey = `${page}-${perPage}-${search}-${sortBy}-${sortOrder}-${classId ?? "all"}`;

      try {
        // Return cached results if present
        if (cache[cacheKey]) {
          set({ students: cache[cacheKey], loading: false });
          return;
        }

        // Append optional class filter to query
        const classFilter = classId ? `&classId=${encodeURIComponent(classId)}` : "";
        const res = await apiClient<{ data: StudentDetail[]; total: number; page: number; perPage: number }>(
          `/api/students?page=${page}&perPage=${perPage}&search=${encodeURIComponent(search)}&sortBy=${sortBy}&sortOrder=${sortOrder}${classFilter}`,
          { auth: true }
        );

        // update state and cache
        set((state) => ({
          students: res.data,
          total: res.total,
          page: res.page,
          perPage: res.perPage,
          cache: { ...state.cache, [cacheKey]: res.data },
          loading: false,
        }));
      } catch (err: any) {
        const message = err?.message || "Failed to fetch students";
        set({ error: message, loading: false });
        // Surface toast for user feedback
        notify.error(message);
      }
    },

    // ---------------------------
    // Fetch single student detail
    // ---------------------------
    fetchStudent: async (id) => {
      set({ loading: true, error: null });
      try {
        const s = await apiClient<{ data: StudentDetail }>(`/api/students/${id}`, { auth: true });
        set({ student: s.data, loading: false });
      } catch (err: any) {
        let message = "Failed to fetch student";
        if (err?.status === 403) message = "Access forbidden: you do not have permission to view this student.";
        else if (err?.status === 404) message = "Student not found or does not belong to your school.";
        set({ error: message, loading: false, student: null });
        notify.error(message);
      }
    },

    // ---------------------------
    // Clear selected student
    // ---------------------------
    clearStudent: () => set({ student: null, error: null }),

    // ---------------------------
    // Search / sort / page helpers (all support optional classId)
    // ---------------------------
    setSearch: (search, classId) => {
      set({ search, page: 1 });
      debouncedFetch(search, classId);
    },

    setSort: (sortBy, sortOrder, classId) => {
      set({ sortBy, sortOrder });
      // immediate fetch when sorting changes
      get().fetchStudents(get().page, get().perPage, get().search, classId);
    },

    setPage: (page, classId) => {
      set({ page });
      get().fetchStudents(page, get().perPage, get().search, classId);
    },

    // ---------------------------
    // Local mutations + optimistic helpers
    // ---------------------------
    addStudent: (student) => {
      set((state) => ({ students: [student, ...state.students] }));
      notify.success(`Added student: ${student.name ?? student.user?.name}`);
    },

    replaceStudent: (oldId, newStudent) => {
      set((state) => ({
        students: state.students.map((s) => (s.id === oldId ? newStudent : s)),
        student: state.student?.id === oldId ? newStudent : state.student,
      }));
      notify.success(`Student updated: ${newStudent.name ?? newStudent.user?.name}`);
    },

    removeStudent: (id) => {
      set((state) => ({
        students: state.students.filter((s) => s.id !== id),
        student: state.student?.id === id ? null : state.student,
      }));
      notify.success(`Student removed`);
    },

    // ---------------------------
    // Create student (optimistic UI)
    // ---------------------------
    addStudentAsync: async ({ name, email, password, classId }) => {
      const tempId = `temp-${Date.now()}`;
      const classesStore = useClassesStore.getState();
      const tempStudent: StudentDetail = {
        id: tempId,
        studentId: tempId,
        name: undefined,
        email: undefined,
        class: classesStore.classes.find((c) => c.id === classId) ?? null,
        enrolledAt: new Date().toISOString(),
        parents: [],
        exams: [],
        transactions: [],
        attendances: [],
        user: { id: tempId, name, email },
      };

      // optimistic add
      get().addStudent(tempStudent);
      set({ loading: true, error: null });

      const response = await apiClient<{ data: StudentDetail }>("/api/students", {
        method: "POST",
        body: { name, email, password, classId },
        auth: true,
      });

      set({ loading: false });
      if (!response?.data) {
        // rollback optimistic add
        get().removeStudent(tempId);
        set({ error: "Failed to add student" });
        notify.error("Failed to add student");
        return;
      }

      const fullStudent = {
        ...response.data,
        user: { id: response.data.user.id, name: response.data.user.name, email: response.data.user.email },
      };
      // replace temporary with persisted
      get().replaceStudent(tempId, fullStudent);
      notify.success(`Student "${fullStudent.user.name}" added successfully`);
    },

    // ---------------------------
    // Update student (server-driven)
    // ---------------------------
    updateStudent: async (id, data) => {
      // prepare payload only with changed fields; server validates further
      const payload: Partial<StudentDetail> & { classId?: string | null } = {};
      if (data.name?.trim()) payload.name = data.name.trim();
      if (data.email?.trim()) payload.email = data.email.trim();
      if (data.password?.trim()) payload.password = data.password;
      if ("classId" in data) payload.classId = data.classId || null;

      if (Object.keys(payload).length === 0) {
        notify.info("No changes to update");
        return;
      }

      set({ loading: true, error: null });
      const response = await apiClient<{ data: StudentDetail }>(`/api/students/${id}`, {
        method: "PATCH",
        body: payload,
        auth: true,
      });

      set({ loading: false });
      if (!response?.data) {
        set({ error: "Failed to update student" });
        notify.error("Failed to update student");
        return;
      }

      // replace updated student in lists
      set((state) => ({
        students: state.students.map((st) => (st.id === id ? response.data : st)),
        student: state.student?.id === id ? response.data : state.student,
      }));

      notify.success(`Student "${response.data.user?.name}" updated successfully`);
    },

    // ---------------------------
    // Delete student (supports class-scoped refresh)
    // ---------------------------
    deleteStudent: async (id, classId) => {
      try {
        await apiClient(`/api/students/${id}`, { method: "DELETE", auth: true, showSuccess: true });
        // remove locally
        set((state) => ({
          students: state.students.filter((s) => s.id !== id),
          student: state.student?.id === id ? null : state.student,
          total: state.total > 0 ? state.total - 1 : 0,
        }));
        // invalidate cache and refresh the currently scoped list
        set({ cache: {} });
        await get().fetchStudents(get().page, get().perPage, get().search, classId);
      } catch (err: any) {
        const message = err?.message || "Failed to delete student";
        notify.error(message);
        throw err;
      }
    },
  };
});

/*
Design reasoning →
This store makes per-class scoping explicit: fetch/set methods accept optional classId so UI (modal or page) can pass the selected class and receive just its students.
Debounced search, cache keys including classId, and optimistic UI for add/remove keep UX fast while preserving correctness.
Errors are surfaced via `notify` and state.error so both toast and UI can show messages.
Server-driven writes (update/delete) always refresh the scoped list after completion to preserve data integrity.

Structure →
- State: student (selected), students (list), pagination, search, sort, cache, loading, error.
- Actions: fetchStudents, fetchStudent, addStudentAsync, updateStudent, deleteStudent, helpers (setSearch/setSort/setPage), optimistic helpers (addStudent/replaceStudent/removeStudent).

Implementation guidance →
- Pass `classId` from the page/modal when calling `fetchStudents`, `setSearch`, `setPage`, `setSort`, and `deleteStudent`.
- Example: `fetchStudents(1, perPage, "", selectedClass.id)` or `setSearch("ali", selectedClass.id)`.
- Keep `apiClient` consistent: it must accept `auth: true` and return parsed JSON with `{ data, total, page, perPage }`.
- Ensure backend `/api/students` honors `classId` query param — server must filter by `classId` when present.

Scalability insight →
- Cache key pattern includes `classId` so multi-class tabs or filters won't collide; adding more filters (status, year) is a matter of adding them into the cacheKey and request query.
- Can extend to support batch operations (bulk import/export, bulk-mark attendance) using similar optimistic patterns and transactions on server side.
*/
