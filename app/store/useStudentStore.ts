"use client";

import { create } from "zustand";
import axios from "axios";
import { useAuthStore } from "./useAuthStore";
import { useAdmissionStore } from "../store/admissionStore.ts";

// ------------------ Types ------------------
export type StudentListItem = {
  id: string;
  userId: string;
  name: string;
  email: string;
  classId?: string | null;
  className?: string | null;
  gradeId?: string | null;
  gradeName?: string | null;
  admissionId?: string | null;
};

export type StudentDetail = StudentListItem & {
  StudentAttendance: any[];
  Exam: any[];
  Parent: any[];
  Borrow: any[];
  Transaction: any[];
  Purchase: any[];
};

// ------------------ Store Interface ------------------
interface StudentStore {
  students: StudentListItem[];
  studentDetail: StudentDetail | null;
  loading: boolean;
  errors: Record<string, string[]>;
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
  filters: {
    search?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    classId?: string;
    gradeId?: string;
    page?: number;
  };

  fetchStudents: (options?: Partial<StudentStore["filters"]>) => Promise<void>;
  fetchStudentDetail: (id: string) => Promise<void>;
  fetchStudentAdmission: (admissionId: string) => Promise<void>;
  createStudent: (
    userId: string,
    classId?: string,
    gradeId?: string
  ) => Promise<void>;
  updateStudent: (
    id: string,
    data: { classId?: string; gradeId?: string }
  ) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  setFilters: (filters: Partial<StudentStore["filters"]>) => void;
  resetStore: () => void;
}

// ------------------ Helper ------------------
async function getSchoolId(): Promise<string> {
  const userLoaded = await useAuthStore.getState().fetchUser();
  if (!userLoaded) throw new Error("Unauthorized: missing school ID");
  return useAuthStore.getState().user!.school.id;
}

// ------------------ Store ------------------
export const useStudentStore = create<StudentStore>((set, get) => ({
  students: [],
  studentDetail: null,
  loading: false,
  errors: {},
  pagination: { page: 1, perPage: 20, total: 0, totalPages: 1 },
  filters: {
    search: "",
    sortBy: "surname",
    sortOrder: "asc",
    page: 1,
  },

  setFilters: (filters) =>
    set({ filters: { ...get().filters, ...filters } }),

  resetStore: () =>
    set({
      students: [],
      studentDetail: null,
      loading: false,
      errors: {},
      pagination: { page: 1, perPage: 20, total: 0, totalPages: 1 },
      filters: { search: "", sortBy: "surname", sortOrder: "asc", page: 1 },
    }),

  // ------------------ GET list ------------------
  fetchStudents: async (opts = {}) => {
    const { filters, pagination } = get();
    const merged = { ...filters, ...opts };

    set({ loading: true, errors: {} });

    try {
      const schoolId = await getSchoolId();

      const params = new URLSearchParams({
        page: String(merged.page ?? pagination.page),
        perPage: String(pagination.perPage),
        sortBy: merged.sortBy ?? "surname",
        sortOrder: merged.sortOrder ?? "asc",
      });

      if (merged.search) params.append("search", merged.search);
      if (merged.classId) params.append("classId", merged.classId);
      if (merged.gradeId) params.append("gradeId", merged.gradeId);

      const res = await axios.get(`/api/students?${params}`, {
        headers: { "X-School-ID": schoolId },
      });

      set({
        students: res.data.students,
        pagination: res.data.pagination,
        filters: merged,
      });
    } catch (err: any) {
      set({
        errors: {
          fetchStudents: [
            err?.response?.data?.error || err.message || "Fetch failed",
          ],
        },
      });
    } finally {
      set({ loading: false });
    }
  },

  // ------------------ GET single ------------------
  fetchStudentDetail: async (id) => {
    set({ loading: true, errors: {} });

    try {
      const schoolId = await getSchoolId();
      const res = await axios.get(`/api/students/${id}`, {
        headers: { "X-School-ID": schoolId },
      });

      set({ studentDetail: res.data.student });
    } catch (err: any) {
      set({
        errors: {
          fetchStudentDetail: [
            err?.response?.data?.error || err.message || "Fetch failed",
          ],
        },
      });
    } finally {
      set({ loading: false });
    }
  },

  // ------------------ Lazy admission load ------------------
  fetchStudentAdmission: async (admissionId) => {
    try {
      if (!admissionId) return;
      await useAdmissionStore.getState().fetchAdmission(admissionId);
    } catch (err: any) {
      set({
        errors: {
          fetchStudentAdmission: [
            err?.response?.data?.error ||
              err.message ||
              "Admission fetch failed",
          ],
        },
      });
    }
  },

  // ------------------ POST create ------------------
  createStudent: async (userId, classId, gradeId) => {
    set({ loading: true, errors: {} });
    try {
      const schoolId = await getSchoolId();

      const res = await axios.post(
        "/api/students",
        { userId, classId, gradeId },
        { headers: { "X-School-ID": schoolId } }
      );

      const newStudent = res.data.student;

      set({
        students: [newStudent, ...get().students],
      });
    } catch (err: any) {
      set({
        errors: {
          createStudent: [
            err?.response?.data?.error || err.message || "Create failed",
          ],
        },
      });
    } finally {
      set({ loading: false });
    }
  },

  // ------------------ PUT update ------------------
  updateStudent: async (id, data) => {
    set({ loading: true, errors: {} });
    try {
      const schoolId = await getSchoolId();
      const res = await axios.put(`/api/students/${id}`, data, {
        headers: { "X-School-ID": schoolId },
      });

      const updated = res.data.student;

      set({
        students: get().students.map((s) =>
          s.id === updated.id ? updated : s
        ),
      });

      if (get().studentDetail?.id === updated.id) {
        set({ studentDetail: updated });
      }
    } catch (err: any) {
      set({
        errors: {
          updateStudent: [
            err?.response?.data?.error || err.message || "Update failed",
          ],
        },
      });
    } finally {
      set({ loading: false });
    }
  },

  // ------------------ DELETE remove ------------------
  deleteStudent: async (id) => {
    set({ loading: true, errors: {} });
    try {
      const schoolId = await getSchoolId();
      await axios.delete(`/api/students/${id}`, {
        headers: { "X-School-ID": schoolId },
      });

      set({
        students: get().students.filter((s) => s.id !== id),
      });

      if (get().studentDetail?.id === id) {
        set({ studentDetail: null });
      }
    } catch (err: any) {
      set({
        errors: {
          deleteStudent: [
            err?.response?.data?.error || err.message || "Delete failed",
          ],
        },
      });
    } finally {
      set({ loading: false });
    }
  },
}));
