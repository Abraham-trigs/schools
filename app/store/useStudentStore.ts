// src/stores/useStudentStore.ts
// Purpose: Zustand store for managing students scoped to authenticated user's school with full CRUD, pagination, search, sorting, and optimistic UI

"use client";

import { create } from "zustand";
import { debounce } from "lodash";
import { apiClient } from "@/lib/apiClient";
import { notify } from "@/lib/helpers/notifications";
import { useClassesStore } from "./useClassesStore";

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
}

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
  fetchStudents: (page?: number, perPage?: number, search?: string) => Promise<void>;
  clearStudent: () => void;
  setSearch: (search: string) => void;
  setSort: (sortBy: "name" | "email" | "createdAt", sortOrder: "asc" | "desc") => void;
  setPage: (page: number) => void;

  addStudent: (student: StudentDetail) => void;
  replaceStudent: (oldId: string, newStudent: StudentDetail) => void;
  removeStudent: (id: string) => void;

  addStudentAsync: (studentData: { name: string; email: string; password?: string; classId: string }) => Promise<void>;
  updateStudent: (id: string, data: Partial<StudentDetail> & { classId?: string | null }) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
}

export const useStudentStore = create<StudentStore>((set, get) => {
  const debouncedFetch = debounce((search: string) => get().fetchStudents(1, get().perPage, search), 400);

  return {
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

    fetchStudents: async (page = get().page, perPage = get().perPage, search = get().search) => {
      set({ loading: true, error: null });
      const { sortBy, sortOrder, cache } = get();
      const cacheKey = `${page}-${perPage}-${search}-${sortBy}-${sortOrder}`;

      try {
        if (cache[cacheKey]) {
          set({ students: cache[cacheKey], loading: false });
          return;
        }

        const res = await apiClient<{ data: StudentDetail[]; total: number; page: number; perPage: number }>(
          `/api/students?page=${page}&perPage=${perPage}&search=${encodeURIComponent(search)}&sortBy=${sortBy}&sortOrder=${sortOrder}`,
          { auth: true }
        );

        set((state) => ({
          students: res.data,
          total: res.total,
          page: res.page,
          perPage: res.perPage,
          cache: { ...state.cache, [cacheKey]: res.data },
          loading: false,
        }));
      } catch (err: any) {
        const message = err.message || "Failed to fetch students";
        set({ error: message, loading: false });
        notify.error(message);
      }
    },

    fetchStudent: async (id) => {
  set({ loading: true, error: null });
  try {
    const s = await apiClient<{ data: StudentDetail }>(`/api/students/${id}`, { auth: true });
    set({ student: s.data, loading: false });
  } catch (err: any) {
    let message = "Failed to fetch student";
    if (err?.status === 403) {
      message = "Access forbidden: you do not have permission to view this student.";
    } else if (err?.status === 404) {
      message = "Student not found or does not belong to your school.";
    }
    set({ error: message, loading: false, student: null });
    notify.error(message);
  }
},


    clearStudent: () => set({ student: null, error: null }),
    setSearch: (search) => { set({ search, page: 1 }); debouncedFetch(search); },
    setSort: (sortBy, sortOrder) => { set({ sortBy, sortOrder }); get().fetchStudents(get().page); },
    setPage: (page) => { set({ page }); get().fetchStudents(page); },

    addStudent: (student) => { set((state) => ({ students: [student, ...state.students] })); notify.success(`Added student: ${student.name}`); },
    replaceStudent: (oldId, newStudent) => {
      set((state) => ({
        students: state.students.map((s) => (s.id === oldId ? newStudent : s)),
        student: state.student?.id === oldId ? newStudent : state.student,
      }));
      notify.success(`Student updated: ${newStudent.name}`);
    },
    removeStudent: (id) => {
      set((state) => ({
        students: state.students.filter((s) => s.id !== id),
        student: state.student?.id === id ? null : state.student,
      }));
      notify.success(`Student removed`);
    },

addStudentAsync: async ({ name, email, password, classId }) => {
  const tempId = `temp-${Date.now()}`;
  const classesStore = useClassesStore.getState();
  
  // Temporary student for optimistic UI
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

  get().addStudent(tempStudent);
  set({ loading: true, error: null });

  const response = await apiClient<{ data: StudentDetail }>("/api/students", {
    method: "POST",
    body: { name, email, password, classId },
    auth: true,
  });

  set({ loading: false });

  if (!response?.data) {
    get().removeStudent(tempId);
    set({ error: "Failed to add student" });
    return;
  }

  // Replace temporary student with real backend data
  const fullStudent = {
    ...response.data,
    user: { id: response.data.user.id, name: response.data.user.name, email: response.data.user.email },
  };
  get().replaceStudent(tempId, fullStudent);
  notify.success(`Student "${fullStudent.user.name}" added successfully`);
},



 updateStudent: async (id, data) => {
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
    return;
  }

  set((state) => ({
    students: state.students.map((st) => (st.id === id ? response.data : st)),
    student: state.student?.id === id ? response.data : state.student,
  }));

  notify.success(`Student "${response.data.user?.name}" updated successfully`);
},


    // Inside deleteStudent
deleteStudent: async (id) => {
  try {
    await apiClient(`/api/students/${id}`, { method: "DELETE", auth: true, showSuccess: true });
    
    // Remove from store
    set((state) => ({
      students: state.students.filter((s) => s.id !== id),
      student: state.student?.id === id ? null : state.student,
      total: state.total - 1, // update total count
    }));

    // Clear cache for current page to force refetch on return
    set((state) => ({ cache: {} }));

    await get().fetchStudents(get().page, get().perPage); // refresh current page
  } catch (err: any) {
    const message = err.message || "Failed to delete student";
    notify.error(message);
    throw err;
  }
},

  };
});

/*
Design reasoning → Centralized store maintains full CRUD state with pagination/search/debounce, aligns with backend API; optimistic UI ensures smooth UX; error handling surfaces actionable messages.
Structure → State (student list, single student, pagination, search, cache), Actions (fetch, add, update, delete, setSearch/sort/page)
Implementation guidance → Connect store to UI components for student table, forms, modals; debounced search avoids API spam; optimistic updates for add/update
Scalability insight → Supports additional filters, caching, related entity expansions; easily extensible for roles, classes, or multi-tenant views
*/
