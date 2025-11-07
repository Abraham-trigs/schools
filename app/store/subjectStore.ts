// app/stores/subjectStore.ts
// Purpose: Zustand store to manage Subjects with pagination, search, filters, and CRUD operations
// Notes: Supports school-scoped subjects and can provide dropdown-ready lists

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
  getDropdownList: () => { value: string; label: string }[];
}

export const useSubjectStore = create<SubjectStoreState>((set, get) => {
  // Debounce to prevent excessive API calls
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

    // Fetch paginated subjects from API
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

    // Create new subject
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

    // Update subject
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

    // Delete subject
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

    // Update search query
    setSearch: (search) => {
      set({ search, page: 1 });
      debouncedFetch(1, search, get().filters);
    },

    // Update current page
    setPage: (page: number) => {
      set({ page });
      debouncedFetch(page, get().search, get().filters);
    },

    // Update filters
    setFilters: (filters: SubjectFilters) => {
      set({ filters, page: 1 });
      debouncedFetch(1, get().search, filters);
    },

    // Return subjects formatted for dropdowns
    getDropdownList: () => get().subjects.map((s) => ({ value: s.id, label: s.name })),
  };
});

/*
Design reasoning:
- Centralizes state for pagination, search, and filters.
- Debounced fetch prevents rapid API calls.
- `getDropdownList` enables dropdown selection in modals/forms.
- School-scoped API ensures users only see subjects belonging to their school.

Scalability:
- Add more filters (department, semester) easily without changing UI logic.
- Infinite scroll or appendable lists can be supported by modifying fetchSubjects.
- Error handling centralized, reusable in components.
*/
