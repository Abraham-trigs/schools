"use client";

import { create } from "zustand";
import axios from "axios";
import { useClassesStore } from "./useClassesStore";
import { notify } from "@/lib/helpers/notifications";

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
  id: string; // student table ID
  name: string;
  email: string;
  studentId: string; // optional user ID
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

  updateStudent: (id: string, data: Partial<StudentDetail> & { classId?: string | null }) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
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
        id: s.id, // student table ID
        name: s.user?.name ?? s.name,
        email: s.user?.email ?? "",
        studentId: s.user?.id ?? "",
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
      notify.error(err.message || "Failed to fetch students");
    }
  },

fetchStudent: async (id) => {
  set({ loading: true, error: null });
  try {
    const res = await axios.get(`/api/students/${id}`);
    const s = res.data;

    // Normalize student object
    const student: StudentDetail & { attendancesSummary?: Record<string, number> } = {
      id: s.id,
      name: s.user?.name ?? s.name,
      email: s.user?.email ?? "",
      studentId: s.user?.id ?? "",
      class: s.class ?? null,
      enrolledAt: s.enrolledAt ?? null,
      parents: s.parents ?? [],
      exams: s.exams ?? [],
      transactions: s.transactions ?? [],
      attendances: s.attendances ?? [],
      attendancesSummary: s.attendancesSummary ?? undefined,
    };

    set({ student, loading: false });
  } catch (err: any) {
    set({ error: err.response?.data?.message || err.message || "Failed to fetch student", loading: false });
    notify.error(err.response?.data?.message || err.message || "Failed to fetch student");
  }
},



  clearStudent: () => set({ student: null, error: null }),
  setSearch: (search) => { set({ search, page: 1 }); get().fetchStudents(1); },
  setSort: (sortBy, sortOrder) => { set({ sortBy, sortOrder }); get().fetchStudents(get().page); },
  setPage: (page) => { set({ page }); get().fetchStudents(page); },

  addStudent: (student) => {
    set((state) => ({ students: [student, ...state.students] }));
    notify.success(`Added student: ${student.name}`);
  },

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
        id: data.Student?.id ?? "",
        name: data.Student?.user?.name ?? data.Student?.name ?? "",
        email: data.Student?.user?.email ?? "",
        studentId: data.Student?.user?.id ?? "",
        class: data.Student?.class ?? null,
        enrolledAt: data.Student?.enrolledAt ?? null,
        parents: data.Student?.parents ?? [],
        exams: data.Student?.exams ?? [],
        transactions: data.Student?.transactions ?? [],
        attendances: data.Student?.attendances ?? [],
      };
      get().replaceStudent(tempId, realStudent);
      notify.success(`Student "${realStudent.name}" added successfully`);
    } catch (err: any) {
      get().removeStudent(tempId);
      notify.error(err.message || "Failed to add student");
      throw err;
    }
  },

  updateStudent: async (id, data) => {
    try {
      const payload: Partial<StudentDetail> & { classId?: string | null } = {};

      if (data.name && data.name.trim() !== "") payload.name = data.name.trim();
      if (data.email && data.email.trim() !== "") payload.email = data.email.trim();
      if (data.password && data.password.trim() !== "") payload.password = data.password;
      if ("classId" in data) payload.classId = data.classId || null;

      if (Object.keys(payload).length === 0) {
        notify.info("No changes to update");
        return;
      }

      const res = await axios.patch(`/api/students/${id}`, payload);
      const s = res.data;

      const updated: StudentDetail = {
        id: s.id,
        name: s.user?.name ?? s.name,
        email: s.user?.email ?? "",
        studentId: s.user?.id ?? "",
        class: s.class ?? null,
        enrolledAt: s.enrolledAt ?? null,
        parents: s.parents ?? [],
        exams: s.exams ?? [],
        transactions: s.transactions ?? [],
        attendances: s.attendances ?? [],
      };

      set((state) => ({
        students: state.students.map((st) => (st.id === id ? updated : st)),
        student: state.student?.id === id ? updated : state.student,
      }));

      notify.success(`Student "${updated.name}" updated successfully`);
    } catch (err: any) {
      notify.error(err.message || "Failed to update student");
      throw err;
    }
  },

  deleteStudent: async (id) => {
    try {
      await axios.delete(`/api/students/${id}`);
      set((state) => ({
        students: state.students.filter((s) => s.id !== id),
        student: state.student?.id === id ? null : state.student,
      }));
      notify.success("Student deleted successfully");
    } catch (err: any) {
      notify.error(err.message || "Failed to delete student");
      throw err;
    }
  },
}));
