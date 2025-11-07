// app/store/subjectStore.ts
// Purpose: Manage subjects with full CRUD, using classes and staff from their respective stores for dropdowns.

"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { useClassesStore } from "./useClassesStore";
import { useStaffStore } from "./useStaffStore";

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

  cache: {
    classes: Record<string, { id: string; name: string }>;
    staff: Record<string, { id: string; name: string }>;
  };

  fetchSubjects: (opts?: {
    page?: number;
    limit?: number;
    search?: string;
    filters?: { classId?: string; staffId?: string };
  }) => Promise<void>;

  createSubject: (payload: Partial<Subject>) => Promise<Subject | null>;
  updateSubject: (id: string, payload: Partial<Subject>) => Promise<Subject | null>;
  deleteSubject: (id: string) => Promise<boolean>;
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

    cache: { classes: {}, staff: {} },

    // ---------------- Fetch subjects ----------------
    fetchSubjects: async ({ page, limit, search, filters } = {}) => {
      set({ loadingFetch: true, error: null });
      try {
        // Sync cache from stores
        const classCache = Object.fromEntries(
          useClassesStore.getState().classes.map((c) => [c.id, { id: c.id, name: c.name }])
        );
        const staffCache = Object.fromEntries(
          useStaffStore.getState().staffList.map((s) => [s.id, { id: s.id, name: s.user.name }])
        );
        set({ cache: { classes: classCache, staff: staffCache } });

        const query = new URLSearchParams();
        query.set("page", String(page ?? get().page));
        query.set("limit", String(limit ?? get().limit));
        if (search ?? get().search) query.set("search", search ?? get().search);

        if (filters) {
          if (filters.classId) query.set("classId", filters.classId);
          if (filters.staffId) query.set("staffId", filters.staffId);
        }

        const res = await fetch(`/api/subjects?${query.toString()}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch subjects");

        // Map IDs to objects using caches from classes/staff stores
        const subjectsWithObjects = data.data.map((s: any) => ({
          ...s,
          classes: s.classIds?.map((id: string) => classCache[id]) || [],
          staff: s.staffIds?.map((id: string) => staffCache[id]) || [],
        }));

        set({ subjects: subjectsWithObjects, meta: data.meta, loadingFetch: false });
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

        set((state) => ({
          subjects: [data, ...state.subjects],
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

        const old = get().subjects.find((s) => s.id === id);
        set((state) => ({
          subjects: state.subjects.map((s) => (s.id === id ? { ...s, ...body } : s)),
        }));

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
        if (old) set((state) => ({
          subjects: state.subjects.map((s) => (s.id === id ? old : s)),
          loadingUpdate: false,
          error: err.message || "Failed to update subject",
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
        cache: { classes: {}, staff: {} },
      }),
  }))
);

/*
Design reasoning → Uses ClassesStore & StaffStore caches to populate dropdowns instead of hitting APIs directly; ensures unified data source across the app.
Structure → subjects store manages CRUD, local search/page, and maps class/staff IDs to objects from the other stores.
Implementation guidance → Call fetchSubjects after ClassesStore.fetchClasses() & StaffStore.fetchStaff() to ensure caches are populated.
Scalability insight → Adding new related entities (e.g., tags, departments) just requires injecting them from their own stores; table/filter logic remains unchanged.
*/
