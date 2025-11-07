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

  bulkErrors: Record<string, string>;
  cache: {
    classes: Record<string, { id: string; name: string }>;
    staff: Record<string, { id: string; name: string }>;
  };

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

    bulkErrors: {},
    cache: { classes: {}, staff: {} },

    // ---------------- Fetch ----------------
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

        // Cache classes/staff
        const classCache: Record<string, { id: string; name: string }> = {};
        const staffCache: Record<string, { id: string; name: string }> = {};
        data.data.forEach((s: Subject) => {
          s.classes?.forEach(c => (classCache[c.id] = c));
          s.staff?.forEach(su => (staffCache[su.id] = su));
        });

        set({
          subjects: data.data,
          meta: data.meta,
          cache: { classes: classCache, staff: staffCache },
          loadingFetch: false,
        });
      } catch (err: any) {
        set({ error: err.message || "Failed to fetch subjects", loadingFetch: false });
      }
    },

    // ---------------- Create ----------------
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

        // Update cache
        const classCache = { ...get().cache.classes };
        data.classes?.forEach((c: any) => (classCache[c.id] = c));
        const staffCache = { ...get().cache.staff };
        data.staff?.forEach((s: any) => (staffCache[s.id] = s));

        set((state) => ({
          subjects: [data, ...state.subjects],
          cache: { classes: classCache, staff: staffCache },
          loadingCreate: false,
        }));
        return data;
      } catch (err: any) {
        set({ error: err.message || "Failed to create subject", loadingCreate: false });
        return null;
      }
    },

    // ---------------- Update ----------------
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

        // Optimistic update
        const old = get().subjects.find(s => s.id === id);
        set((state) => ({
          subjects: state.subjects.map(s => s.id === id ? { ...s, ...body } : s)
        }));

        const res = await fetch(`/api/subjects/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update subject");

        // Update cache
        const classCache = { ...get().cache.classes };
        data.classes?.forEach((c: any) => (classCache[c.id] = c));
        const staffCache = { ...get().cache.staff };
        data.staff?.forEach((s: any) => (staffCache[s.id] = s));

        set((state) => ({
          subjects: state.subjects.map(s => s.id === id ? data : s),
          cache: { classes: classCache, staff: staffCache },
          loadingUpdate: false,
        }));
        return data;
      } catch (err: any) {
        // rollback optimistic update
        const old = get().subjects.find(s => s.id === id);
        if (old) set((state) => ({
          subjects: state.subjects.map(s => s.id === id ? old : s),
          loadingUpdate: false,
          error: err.message || "Failed to update subject"
        }));
        return null;
      }
    },

    // ---------------- Delete ----------------
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

    // ---------------- Bulk Update ----------------
    bulkUpdateSubjects: async (payloads) => {
      set({ loadingUpdate: true, bulkErrors: {}, error: null });
      const oldSubjects = [...get().subjects];

      // Optimistically update subjects
      set((state) => ({
        subjects: state.subjects.map(s => {
          const update = payloads.find(p => p.id === s.id);
          if (!update) return s;
          return {
            ...s,
            classes: update.classIds?.map(id => get().cache.classes[id]) || [],
            staff: update.staffIds?.map(id => get().cache.staff[id]) || []
          };
        })
      }));

      const results: Subject[] = [];
      const errors: Record<string, string> = {};

      await Promise.all(payloads.map(async (p) => {
        try {
          const res = await fetch(`/api/subjects/${p.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ classIds: p.classIds || [], staffIds: p.staffIds || [] }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Failed to bulk update subject");
          results.push(data);

          // Update cache
          const classCache = { ...get().cache.classes };
          data.classes?.forEach((c: any) => (classCache[c.id] = c));
          const staffCache = { ...get().cache.staff };
          data.staff?.forEach((s: any) => (staffCache[s.id] = s));
          set({ cache: { classes: classCache, staff: staffCache } });

        } catch (err: any) {
          errors[p.id] = err.message || "Failed to update";
        }
      }));

      // Merge results into store
      set((state) => ({
        subjects: state.subjects.map(s => results.find(r => r.id === s.id) || s),
        bulkErrors: errors,
        loadingUpdate: false,
      }));

      return results.length > 0 ? results : null;
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
        bulkErrors: {},
        cache: { classes: {}, staff: {} },
      }),
  }))
);
