import { create } from "zustand";
import { Subject } from "@prisma/client";
import { debounce } from "lodash";

interface SubjectFilters {
  classId?: string;
  staffId?: string;
}

interface SubjectStoreState {
  subjects: Subject[];
  total: number;
  page: number;
  limit: number;
  search: string;
  filters: SubjectFilters;
  loading: boolean;
  error: string | null;

  fetchSubjects: (page?: number, search?: string, filters?: SubjectFilters) => Promise<void>;
  createSubject: (data: { name: string; code?: string | null }) => Promise<Subject | null>;
  updateSubject: (id: string, data: { name?: string; code?: string | null }) => Promise<Subject | null>;
  deleteSubject: (id: string) => Promise<boolean>;
  setSearch: (search: string) => void;
  setPage: (page: number) => void;
  setFilters: (filters: SubjectFilters) => void;
}

export const useSubjectStore = create<SubjectStoreState>((set, get) => {
  const debouncedFetch = debounce((page?: number, search?: string, filters?: SubjectFilters) => {
    get().fetchSubjects(page, search, filters);
  }, 300);

  return {
    subjects: [],
    total: 0,
    page: 1,
    limit: 20,
    search: "",
    filters: {},
    loading: false,
    error: null,

    fetchSubjects: async (page = get().page, search = get().search, filters = get().filters) => {
      set({ loading: true, error: null });
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(get().limit),
        });
        if (search) params.append("search", search);
        if (filters.classId) params.append("classId", filters.classId);
        if (filters.staffId) params.append("staffId", filters.staffId);

        const res = await fetch(`/api/subjects?${params.toString()}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to fetch subjects");

        set({
          subjects: json.data,
          total: json.meta.total,
          page: json.meta.page || page,
          limit: json.meta.limit || get().limit,
        });
      } catch (err: any) {
        set({ error: err.message || "Unknown error" });
      } finally {
        set({ loading: false });
      }
    },

    createSubject: async (data) => {
      set({ loading: true, error: null });
      try {
        const res = await fetch("/api/subjects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(JSON.stringify(json?.error) || "Failed to create subject");

        set((state) => ({ subjects: [json, ...state.subjects], total: state.total + 1 }));
        return json;
      } catch (err: any) {
        set({ error: err.message });
        return null;
      } finally {
        set({ loading: false });
      }
    },

    updateSubject: async (id, data) => {
      set({ loading: true, error: null });
      try {
        const res = await fetch(`/api/subjects/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(JSON.stringify(json?.error) || "Failed to update subject");

        set((state) => ({
          subjects: state.subjects.map((s) => (s.id === id ? json : s)),
        }));
        return json;
      } catch (err: any) {
        set({ error: err.message });
        return null;
      } finally {
        set({ loading: false });
      }
    },

    deleteSubject: async (id) => {
      set({ loading: true, error: null });
      try {
        const res = await fetch(`/api/subjects/${id}`, { method: "DELETE" });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Failed to delete subject");

        set((state) => ({
          subjects: state.subjects.filter((s) => s.id !== id),
          total: state.total - 1,
        }));
        return true;
      } catch (err: any) {
        set({ error: err.message });
        return false;
      } finally {
        set({ loading: false });
      }
    },

    setSearch: (search) => {
      set({ search, page: 1 });
      debouncedFetch(1, search, get().filters);
    },

    setPage: (page) => {
      set({ page });
      debouncedFetch(page, get().search, get().filters);
    },

    setFilters: (filters) => {
      set({ filters, page: 1 });
      debouncedFetch(1, get().search, filters);
    },
  };
});
