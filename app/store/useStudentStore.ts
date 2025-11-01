"use client";

import { create } from "zustand";
import axios from "axios";
import { useClassesStore } from "./useClassesStore";
import { notify } from "@/lib/helpers/notifications"; // <-- notify object

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

  addStudentAsync: (studentData: {
    name: string;
    email: string;
    password?: string;
    classId: string;
  }) => Promise<void>;
}

export const useStudentStore = create<StudentStore>((set, get) => ({
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

  // -------------------------------
  // Fetch multiple students
  // -------------------------------
  fetchStudents: async (page = get().page, perPage = get().perPage, search = get().search) => {
    set({ loading: true, error: null });
    const { sortBy, sortOrder, cache } = get();
    const cacheKey = `${page}-${perPage}-${search}-${sortBy}-${sortOrder}`;

    try {
      if (cache[cacheKey]) {
        set({ students: cache[cacheKey], loading: false });
        return;
      }

      const res = await axios.get("/api/students", { params: { page, perPage, search, sortBy, sortOrder } });
      const students: StudentDetail[] = res.data.students.map((s: any) => ({
        id: s.user?.id ?? s.id,
        name: s.user?.name ?? s.name,
        email: s.user?.email ?? "",
        studentId: s.id,
        class: s.class ?? null,
        enrolledAt: s.enrolledAt ?? null,
        parents: s.parents ?? [],
        exams: s.exams ?? [],
        transactions: s.transactions ?? [],
        attendances: s.attendances ?? [],
      }));

      set((state) => ({
        students,
        total: res.data.total,
        page: res.data.page,
        perPage: res.data.perPage,
        cache: { ...state.cache, [cacheKey]: students },
        loading: false,
      }));
    } catch (err: any) {
      set({ error: err.message || "Failed to fetch students", loading: false });
      notify.error(err.message || "Failed to fetch students"); // <-- corrected notify
    }
  },

  // -------------------------------
  // Fetch a single student
  // -------------------------------
  fetchStudent: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await axios.get(`/api/students/${id}`);
      const s = res.data;
      const student: StudentDetail = {
        id: s.user?.id ?? s.id,
        name: s.user?.name ?? s.name,
        email: s.user?.email ?? "",
        studentId: s.id,
        class: s.class ?? null,
        enrolledAt: s.enrolledAt ?? null,
        parents: s.parents ?? [],
        exams: s.exams ?? [],
        transactions: s.transactions ?? [],
        attendances: s.attendances ?? [],
      };
      set({ student, loading: false });
    } catch (err: any) {
      set({ error: err.message || "Failed to fetch student", loading: false });
      notify.error(err.message || "Failed to fetch student"); // <-- corrected notify
    }
  },

  clearStudent: () => set({ student: null, error: null }),

  setSearch: (search) => {
    set({ search, page: 1 });
    get().fetchStudents(1);
  },

  setSort: (sortBy, sortOrder) => {
    set({ sortBy, sortOrder });
    get().fetchStudents(get().page);
  },

  setPage: (page) => {
    set({ page });
    get().fetchStudents(page);
  },

  // -------------------------------
  // Directly add a student to the store (optimistic)
  // -------------------------------
  addStudent: (student) => {
    set((state) => ({ students: [student, ...state.students] }));
    notify.success(`Added student: ${student.name}`); // <-- corrected notify
  },

  // -------------------------------
  // Replace a temporary student with real data
  // -------------------------------
  replaceStudent: (oldId, newStudent) => {
    set((state) => ({ students: state.students.map((s) => (s.id === oldId ? newStudent : s)) }));
    notify.success(`Student updated: ${newStudent.name}`); // <-- corrected notify
  },

  // -------------------------------
  // Remove a student from the store
  // -------------------------------
  removeStudent: (id) => {
    set((state) => ({ students: state.students.filter((s) => s.id !== id) }));
    notify.success(`Student removed`); // <-- corrected notify
  },

  // -------------------------------
  // Async add student (with backend POST)
  // -------------------------------
  addStudentAsync: async ({ name, email, password, classId }) => {
    const tempId = `temp-${Date.now()}`;
    const classesStore = useClassesStore.getState();
    const tempStudent: StudentDetail = {
      id: tempId,
      name,
      email,
      studentId: tempId,
      class: classesStore.classes.find((c) => c.id === classId) ?? null,
      parents: [],
      exams: [],
      transactions: [],
      attendances: [],
    };

    get().addStudent(tempStudent);

    try {
      const res = await axios.post("/api/students", { name, email, password, classId });
      const data = res.data;

      const realStudent: StudentDetail = {
        id: data.Student?.user?.id ?? "",
        name: data.Student?.user?.name ?? data.Student?.name ?? "",
        email: data.Student?.user?.email ?? "",
        studentId: data.Student?.id ?? "",
        class: data.Student?.class ?? null,
        enrolledAt: data.Student?.enrolledAt ?? null,
        parents: data.Student?.parents ?? [],
        exams: data.Student?.exams ?? [],
        transactions: data.Student?.transactions ?? [],
        attendances: data.Student?.attendances ?? [],
      };

      get().replaceStudent(tempId, realStudent);
      notify.success(`Student "${realStudent.name}" added successfully`); // <-- corrected notify
    } catch (err: any) {
      get().removeStudent(tempId);
      notify.error(err.message || "Failed to add student"); // <-- corrected notify
      throw err;
    }
  },
}));
