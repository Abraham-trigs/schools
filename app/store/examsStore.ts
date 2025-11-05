// stores/examStore.ts
import { create } from "zustand";
import { Exam } from "@prisma/client";

interface ExamState {
  exams: Exam[];
  total: number;
  loading: boolean;
  error: string | null;
  fetchExams: (options?: {
    search?: string;
    page?: number;
    limit?: number;
    studentId?: string;
  }) => Promise<void>;
  createExam: (data: Partial<Exam>) => Promise<Exam | null>;
  updateExam: (id: string, data: Partial<Exam>) => Promise<Exam | null>;
  deleteExam: (id: string) => Promise<boolean>;
  reset: () => void;
}

export const useExamStore = create<ExamState>((set, get) => ({
  exams: [],
  total: 0,
  loading: false,
  error: null,

  fetchExams: async ({ search = "", page = 1, limit = 20, studentId } = {}) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (page) params.append("page", String(page));
      if (limit) params.append("limit", String(limit));
      if (studentId) params.append("studentId", studentId);

      const res = await fetch(`/api/exams?${params.toString()}`);
      const json = await res.json();
      if (res.ok) set({ exams: json.data, total: json.total });
      else set({ error: json.error });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  },

  createExam: async (data) => {
    try {
      const res = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (res.ok) {
        set({ exams: [json.data, ...get().exams] });
        return json.data;
      } else {
        set({ error: json.error });
        return null;
      }
    } catch (err: any) {
      set({ error: err.message });
      return null;
    }
  },

  updateExam: async (id, data) => {
    try {
      const res = await fetch(`/api/exams/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (res.ok) {
        set({ exams: get().exams.map((e) => (e.id === id ? json.data : e)) });
        return json.data;
      } else {
        set({ error: json.error });
        return null;
      }
    } catch (err: any) {
      set({ error: err.message });
      return null;
    }
  },

  deleteExam: async (id) => {
    try {
      const res = await fetch(`/api/exams/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (res.ok) {
        set({ exams: get().exams.filter((e) => e.id !== id) });
        return true;
      } else {
        set({ error: json.error });
        return false;
      }
    } catch (err: any) {
      set({ error: err.message });
      return false;
    }
  },

  reset: () => set({ exams: [], total: 0, loading: false, error: null }),
}));
