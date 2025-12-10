"use client";

import { create } from "zustand";
import { Class } from "@prisma/client";
import axios from "axios";
import { useStudentStore, StudentListItem } from "./studentStore";

// ------------------ Types ------------------
export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

export type AttendanceRecord = {
  studentId: string;
  status: AttendanceStatus;
  timeIn?: string;
  timeOut?: string;
  remarks?: string;
};

interface ClassesStore {
  classes: Class[];
  total: number;
  page: number;
  perPage: number;
  loading: boolean;
  error: string | null;

  selectedClass: Class | null;
  students: StudentListItem[];
  attendance: AttendanceRecord[];

  search: string;
  sortBy: "name" | "createdAt";
  sortOrder: "asc" | "desc";
  dateFilter?: string;
  cache: Record<string, Class[]>;

  fetchClasses: (page?: number, perPage?: number, search?: string) => Promise<void>;
  fetchClassById: (id: string) => Promise<void>;
  fetchStudents: (classId: string) => Promise<void>;
  fetchAttendance: (classId: string, date?: string) => Promise<void>;

  createClass: (name: string) => Promise<{ success: boolean; data?: Class; error?: string }>;
  updateClass: (id: string, name?: string) => Promise<boolean>;
  deleteClass: (id: string) => Promise<void>;
  markAttendance: (classId: string, records: AttendanceRecord[], date?: string) => Promise<void>;

  selectClass: (cls: Class) => void;
  clearSelectedClass: () => void;

  setSearch: (search: string) => void;
  setSort: (sortBy: "name" | "createdAt", sortOrder: "asc" | "desc") => void;
  setDateFilter: (date?: string) => void;
}

// ------------------ Store ------------------
export const useClassesStore = create<ClassesStore>((set, get) => ({
  classes: [],
  total: 0,
  page: 1,
  perPage: 10,
  loading: false,
  error: null,

  selectedClass: null,
  students: [],
  attendance: [],
  search: "",
  sortBy: "name",
  sortOrder: "asc",
  dateFilter: undefined,
  cache: {},

  // ------------------ Classes ------------------
  fetchClasses: async (page = get().page, perPage = get().perPage, search = get().search) => {
    set({ loading: true, error: null });
    const { sortBy, sortOrder, dateFilter, cache } = get();
    const cacheKey = `${page}-${perPage}-${search}-${sortBy}-${sortOrder}-${dateFilter}`;

    try {
      if (cache[cacheKey]) {
        set({ classes: cache[cacheKey], loading: false });
        return;
      }

      const res = await axios.get(`/api/classes?page=${page}&perPage=${perPage}&search=${encodeURIComponent(search)}`);
      const data = res.data;

      set((state) => ({
        classes: data.classes,
        total: data.total,
        page: data.page,
        perPage: data.perPage,
        cache: { ...state.cache, [cacheKey]: data.classes },
        loading: false,
      }));
    } catch (err: any) {
      set({ error: err.response?.data?.error || err.message, loading: false });
    }
  },

  fetchClassById: async (id: string) => {
    set({ loading: true });
    try {
      const res = await axios.get(`/api/classes/${id}`);
      set({ selectedClass: res.data.class, loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.error || err.message, loading: false });
    }
  },

  fetchStudents: async (classId: string) => {
    set({ loading: true });
    try {
      const studentStore = useStudentStore.getState();
      await studentStore.fetchStudents(1, 20, ""); // Fetch first page
      const students = studentStore.students.filter((s) => s.classId === classId);
      set({ students, loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.error || err.message, loading: false });
    }
  },

  fetchAttendance: async (classId: string, date?: string) => {
    set({ loading: true });
    try {
      const res = await axios.get(`/api/classes/${classId}/attendance?date=${date || ""}`);
      set({ attendance: res.data || [], loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.error || err.message, loading: false });
    }
  },

  // ------------------ Mutations ------------------
  createClass: async (name: string) => {
    set({ loading: true });
    try {
      const res = await axios.post("/api/classes", { name });
      set((state) => ({ classes: [res.data, ...state.classes], cache: {}, loading: false }));
      return { success: true, data: res.data };
    } catch (err: any) {
      set({ error: err.response?.data?.error || err.message, loading: false });
      return { success: false, error: err.response?.data?.error || err.message };
    }
  },

  updateClass: async (id: string, name?: string) => {
    set({ loading: true });
    try {
      const res = await axios.put(`/api/classes/${id}`, { name });
      set((state) => {
        const updatedClasses = state.classes.map((c) => (c.id === id ? { ...c, ...res.data } : c));
        const updatedSelected = state.selectedClass?.id === id ? { ...state.selectedClass, ...res.data } : state.selectedClass;
        return { classes: updatedClasses, selectedClass: updatedSelected, loading: false };
      });
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.error || err.message, loading: false });
      return false;
    }
  },

  deleteClass: async (id: string) => {
    set({ loading: true });
    try {
      await axios.delete(`/api/classes/${id}`);
      set((state) => ({
        classes: state.classes.filter((c) => c.id !== id),
        selectedClass: state.selectedClass?.id === id ? null : state.selectedClass,
        cache: {},
        loading: false,
      }));
    } catch (err: any) {
      set({ error: err.response?.data?.error || err.message, loading: false });
    }
  },

  markAttendance: async (classId: string, records: AttendanceRecord[], date?: string) => {
    set({ loading: true });
    try {
      await axios.post(`/api/classes/${classId}/attendance`, { date, records });
      await get().fetchAttendance(classId, date);
      set({ loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.error || err.message, loading: false });
    }
  },

  // ------------------ Helpers ------------------
  selectClass: (cls: Class) => set({ selectedClass: { ...cls } }),
  clearSelectedClass: () => set({ selectedClass: null }),

  setSearch: (search: string) => {
    set({ search, page: 1 });
    get().fetchClasses(1);
  },

  setSort: (sortBy: "name" | "createdAt", sortOrder: "asc" | "desc") => {
    set({ sortBy, sortOrder });
    get().fetchClasses(get().page);
  },

  setDateFilter: (date?: string) => {
    set({ dateFilter: date });
    get().fetchClasses(1);
  },
}));


// ✅ Notes & Improvements:

// Students are fetched via the main /api/students API using the student store, avoiding nested routes.

// Paginated, RESTful classes API fully integrated.

// Grades/sections are included via the classId reference.

// Attendance endpoint works with optional date filters.

// Fully typed with AttendanceRecord and StudentListItem.

// Cache for classes is maintained per query page/search/sort.
