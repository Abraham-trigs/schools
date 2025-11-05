// app/stores/subjectStore.ts
// Purpose: Zustand store to manage Subjects with pagination, search, filters, and CRUD operations

import { create } from "zustand";
import { Subject } from "@prisma/client";
import { debounce } from "lodash";

interface SubjectFilters {
  classId?: string;
  staffId?: string;
  fromDate?: string; // ISO string
  toDate?: string;   // ISO string
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
  createSubject: (data: { name: string; code?: string | null }) => Promise<Subject | void>;
  updateSubject: (id: string, data: { name?: string; code?: string | null }) => Promise<Subject | void>;
  deleteSubject: (id: string) => Promise<void>;
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
        if (filters.fromDate) params.append("fromDate", filters.fromDate);
        if (filters.toDate) params.append("toDate", filters.toDate);

        const res = await fetch(`/api/subjects?${params.toString()}`);
        const text = await res.text();
        const json = text ? JSON.parse(text) : { data: [], meta: { total: 0 } };
        if (!res.ok) throw new Error(json.error || "Failed to fetch subjects");

        set({ subjects: json.data, total: json.meta.total, page, search, filters });
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
        const text = await res.text();
        const json = text ? JSON.parse(text) : null;
        if (!res.ok) throw new Error(JSON.stringify(json?.error) || "Failed to create subject");

        if (json) set((state) => ({ subjects: [json, ...state.subjects], total: state.total + 1 }));
        return json;
      } catch (err: any) {
        set({ error: err.message });
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
        const text = await res.text();
        const json = text ? JSON.parse(text) : null;
        if (!res.ok) throw new Error(JSON.stringify(json?.error) || "Failed to update subject");

        if (json)
          set((state) => ({
            subjects: state.subjects.map((s) => (s.id === id ? json : s)),
          }));
        return json;
      } catch (err: any) {
        set({ error: err.message });
      } finally {
        set({ loading: false });
      }
    },

    deleteSubject: async (id) => {
      set({ loading: true, error: null });
      try {
        const res = await fetch(`/api/subjects/${id}`, { method: "DELETE" });
        const text = await res.text();
        const json = text ? JSON.parse(text) : null;
        if (!res.ok) throw new Error(json?.error || "Failed to delete subject");

        set((state) => ({
          subjects: state.subjects.filter((s) => s.id !== id),
          total: state.total - 1,
        }));
      } catch (err: any) {
        set({ error: err.message });
      } finally {
        set({ loading: false });
      }
    },

    setSearch: (search) => {
      set({ search, page: 1 });
      debouncedFetch(1, search, get().filters);
    },

    setPage: (page: number) => {
      set({ page });
      debouncedFetch(page, get().search, get().filters);
    },

    setFilters: (filters: SubjectFilters) => {
      set({ filters, page: 1 });
      debouncedFetch(1, get().search, filters);
    },
  };
});

/*
Design reasoning:
- Centralizes pagination, search, and filter state for predictable updates.
- Debounced fetch prevents rapid API calls while typing/searching.
- Safe JSON parsing prevents "Unexpected end of JSON input" errors.

Structure:
- State: subjects, total, page, limit, search, filters, loading, error
- Actions: fetchSubjects, createSubject, updateSubject, deleteSubject, setSearch, setPage, setFilters

Implementation guidance:
- Call setSearch/setFilters/setPage to trigger debounced API calls.
- Use subjects, loading, and error to render UI.
- Pagination buttons should call setPage(pageNumber).

Scalability insight:
- Additional filters or fields can be added without changing component logic.
- Infinite scroll support is possible by appending subjects instead of replacing.
*/
