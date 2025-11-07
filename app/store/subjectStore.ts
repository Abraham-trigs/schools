import { create } from "zustand";
import { devtools } from "zustand/middleware";

export type Subject = {
  id: string;
  name: string;
  description: string | null;
  code: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: { id: string; name: string; role: string };
  classes?: { id: string; name: string }[];
  staff?: { id: string; name: string }[];
};

type Meta = { total: number; page: number; limit: number };

type SubjectsStore = {
  subjects: Subject[];
  meta: Meta;
  search: string;
  page: number;
  limit: number;
  error: string | null;

  loadingFetch: boolean;
  loadingCreate: boolean;
  loadingUpdate: boolean;
  loadingDelete: boolean;

  fetchSubjects: (opts?: { page?: number; limit?: number; search?: string }) => Promise<void>;
  createSubject: (payload: Partial<Subject>) => Promise<Subject | null>;
  updateSubject: (id: string, payload: Partial<Subject>) => Promise<Subject | null>;
  deleteSubject: (id: string) => Promise<boolean>;
  bulkUpdateSubjects: (payloads: { id: string; classIds?: string[]; staffIds?: string[] }[]) => Promise<Subject[] | null>;
  setSearch: (query: string) => void;
  setPage: (page: number) => void;
  reset: () => void;
};

export const useSubjectsStore = create<SubjectsStore>()(
  devtools((set, get) => ({
    subjects: [],
    meta: { total: 0, page: 1, limit: 10 },
    search: "",
    page: 1,
    limit: 10,
    error: null,

    loadingFetch: false,
    loadingCreate: false,
    loadingUpdate: false,
    loadingDelete: false,

    fetchSubjects: async ({ page, limit, search } = {}) => {
      set({ loadingFetch: true, error: null });
      try {
        const query = new URLSearchParams();
        query.set("page", String(page ?? get().page));
        query.set("limit", String(limit ?? get().limit));
        if (search ?? get().search) query.set("search", search ?? get().search);

        const res = await fetch(`/api/subjects?${query.toString()}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch subjects");

        set({ subjects: data.data, meta: data.meta, loadingFetch: false });
      } catch (err: any) {
        set({ error: err.message || "Failed to fetch subjects", loadingFetch: false });
      }
    },

    createSubject: async (payload) => {
      set({ loadingCreate: true, error: null });
      try {
        const body = {
          name: payload.name?.trim(),
          code: payload.code?.trim().toUpperCase() || null,
          description: payload.description?.trim() || null,
          classIds: payload.classes?.map((c) => c.id) || [],
          staffIds: payload.staff?.map((s) => s.id) || [],
        };

        const res = await fetch("/api/subjects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create subject");

        set((state) => ({ subjects: [data, ...state.subjects], loadingCreate: false }));
        return data;
      } catch (err: any) {
        set({ error: err.message || "Failed to create subject", loadingCreate: false });
        return null;
      }
    },

    updateSubject: async (id, payload) => {
      set({ loadingUpdate: true, error: null });
      try {
        const body = {
          name: payload.name?.trim(),
          code: payload.code?.trim().toUpperCase() || null,
          description: payload.description?.trim() || null,
          classIds: payload.classes?.map((c) => c.id) || [],
          staffIds: payload.staff?.map((s) => s.id) || [],
        };

        const res = await fetch(`/api/subjects/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update subject");

        set((state) => ({
          subjects: state.subjects.map((s) => (s.id === id ? data : s)),
          loadingUpdate: false,
        }));
        return data;
      } catch (err: any) {
        set({ error: err.message || "Failed to update subject", loadingUpdate: false });
        return null;
      }
    },

    deleteSubject: async (id) => {
      set({ loadingDelete: true, error: null });
      try {
        const res = await fetch(`/api/subjects/${id}`, { method: "DELETE" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to delete subject");

        set((state) => ({ subjects: state.subjects.filter((s) => s.id !== id), loadingDelete: false }));
        return true;
      } catch (err: any) {
        set({ error: err.message || "Failed to delete subject", loadingDelete: false });
        return false;
      }
    },

    bulkUpdateSubjects: async (payloads) => {
      set({ loadingUpdate: true, error: null });
      try {
        const updates = await Promise.all(
          payloads.map(async (p) => {
            const res = await fetch(`/api/subjects/${p.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                classIds: p.classIds || [],
                staffIds: p.staffIds || [],
              }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to bulk update subject");
            return data;
          })
        );

        set((state) => ({
          subjects: state.subjects.map((s) => updates.find((u) => u.id === s.id) || s),
          loadingUpdate: false,
        }));

        return updates;
      } catch (err: any) {
        set({ error: err.message || "Failed to bulk update subjects", loadingUpdate: false });
        return null;
      }
    },

    setSearch: (query) => set({ search: query }),
    setPage: (page) => set({ page }),
    reset: () =>
      set({
        subjects: [],
        meta: { total: 0, page: 1, limit: 10 },
        search: "",
        page: 1,
        limit: 10,
        error: null,
        loadingFetch: false,
        loadingCreate: false,
        loadingUpdate: false,
        loadingDelete: false,
      }),
  }))
);
