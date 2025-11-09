// File: app/store/useStaffStore.ts
// Purpose: Zustand store for Staff management; handles full CRUD with User-first creation, optimistic updates, pagination, search, filtering, caching, rollback safety, and role inference.

"use client";

import { create } from "zustand";
import { debounce } from "lodash";
import { z } from "zod";
import { apiClient } from "@/lib/apiClient";
import { requiresClass, requiresSubjects } from "@/lib/api/constants/roleInference";

// ------------------------- Types -------------------------
export interface Staff {
  id: string;
  userId: string;
  user: { id: string; name: string; email: string };
  class?: { id: string; name: string } | null;
  department?: { id: string; name: string } | null;
  position?: string | null;
  salary?: number | null;
  subjects?: string[];
  hireDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StaffPayload {
  name: string;
  email: string;
  password: string;
  position?: string;
  department?: string | null;
  classId?: string | null;
  salary?: number | null;
  subjects?: string[];
  hireDate?: string | null;
}

export type StaffFilters = {
  role?: string;
  departmentId?: string;
};

interface StaffState {
  staffList: Staff[];
  selectedStaff: Staff | null;
  total: number;
  page: number;
  perPage: number;
  search: string;
  filters: StaffFilters;
  loading: boolean;
  error: string | null;
  cache: Record<number, Staff[]>;

  setPage: (page: number) => void;
  setPerPage: (perPage: number) => void;
  setSearch: (search: string) => void;
  setFilters: (filters: StaffFilters) => void;

  setSelectedStaff: (staff: Staff | null) => void;
  fetchStaff: (page?: number, search?: string) => Promise<void>;
  fetchStaffDebounced: (page?: number, search?: string) => void;
  fetchStaffById: (id: string) => Promise<Staff | null>;

  createStaff: (payload: StaffPayload) => Promise<Staff | null>;
  updateStaff: (id: string, payload: Partial<StaffPayload>) => Promise<Staff | null>;
  deleteStaff: (id: string) => Promise<void>;

  totalPages: () => number;
}

// ------------------------- Store -------------------------
export const useStaffStore = create<StaffState>((set, get) => {
  // Debounced fetch to reduce network calls
  const fetchStaffDebounced = debounce((page?: number, search?: string) => {
    get().fetchStaff(page, search);
  }, 300);

  // Normalize staff payload before sending to API
  const normalizeStaffPayload = (payload: StaffPayload) => {
    const schema = z.object({
      name: z.string(),
      email: z.string().email(),
      password: z.string(),
      position: z.string().optional(),
      department: z.string().nullable().optional(),
      classId: z.string().nullable().optional(),
      salary: z.number().nullable().optional(),
      subjects: z.array(z.string()).optional(),
      hireDate: z.string().nullable().optional(),
    });

    const parsed = schema.parse(payload);

    return {
      ...parsed,
      position: parsed.position ?? "Teacher",
      classId: requiresClass(parsed.position) ? parsed.classId ?? null : null,
      subjects: requiresSubjects(parsed.position) ? parsed.subjects ?? [] : [],
      salary: parsed.salary ?? null,
      hireDate: parsed.hireDate ?? new Date().toISOString(),
    };
  };

  // Build query string for GET /api/staff
  const buildQueryString = () => {
    const params = new URLSearchParams();
    params.set("page", get().page.toString());
    params.set("perPage", get().perPage.toString());
    if (get().search) params.set("search", get().search);
    if (get().filters.role) params.set("role", get().filters.role);
    if (get().filters.departmentId) params.set("departmentId", get().filters.departmentId);
    return params.toString();
  };

  return {
    staffList: [],
    selectedStaff: null,
    total: 0,
    page: 1,
    perPage: 10,
    search: "",
    filters: {},
    loading: false,
    error: null,
    cache: {},

    setPage: (page) => set({ page }),
    setPerPage: (perPage) => set({ perPage }),
    setSearch: (search) => {
      set({ search, page: 1 });
      fetchStaffDebounced(1, search);
    },
    setFilters: (filters) => {
      set({ filters, page: 1 });
      fetchStaffDebounced(1);
    },
    setSelectedStaff: (staff) => set({ selectedStaff: staff }),

    // ------------------------- Fetch staff list -------------------------
    fetchStaff: async (page = get().page, search = get().search) => {
      const cached = get().cache[page];
      if (cached && !search) {
        set({ staffList: cached, page });
        return;
      }

      set({ loading: true, error: null });
      try {
        const query = buildQueryString();
        const data = await apiClient<{ staffList: Staff[]; total: number; page: number }>(
          `/api/staff?${query}`
        );

        const mergedCache: Record<number, Staff[]> = { ...get().cache };
        Object.keys(mergedCache).forEach((p) => {
          mergedCache[+p] = mergedCache[+p].map((s) => {
            const updated = data.staffList.find((u) => u.id === s.id);
            return updated ?? s;
          });
        });

        set({
          staffList: data.staffList,
          total: data.total,
          page: data.page,
          cache: search === "" ? { ...mergedCache, [page]: data.staffList } : mergedCache,
        });
      } catch (err: any) {
        set({ error: err?.message || "Failed to fetch staff" });
      } finally {
        set({ loading: false });
      }
    },

    fetchStaffDebounced,

    fetchStaffById: async (id: string) => {
      set({ loading: true, error: null });
      try {
        const existing = get().staffList.find((s) => s.id === id);
        if (existing) {
          set({ selectedStaff: existing });
          return existing;
        }

        const fetched = await apiClient<Staff>(`/api/staff/${id}`);
        set({ selectedStaff: fetched });

        set((state) => {
          const updatedCache = Object.fromEntries(
            Object.entries(state.cache).map(([page, list]) => [
              page,
              list.map((s) => (s.id === id ? fetched : s)),
            ])
          );
          const updatedStaffList = state.staffList.map((s) => (s.id === id ? fetched : s));
          return {
            staffList: updatedStaffList.includes(fetched) ? updatedStaffList : [fetched, ...updatedStaffList],
            cache: updatedCache,
          };
        });

        return fetched;
      } catch (err: any) {
        set({ error: err?.message || "Failed to fetch staff by id" });
        return null;
      } finally {
        set({ loading: false });
      }
    },

    // ------------------------- Create staff (User-first) -------------------------
    createStaff: async (payload: StaffPayload) => {
      set({ loading: true, error: null });

      const normalized = normalizeStaffPayload(payload);

      // Optimistic update with temporary ID
      const tempId = `temp-${Date.now()}`;
      const optimisticStaff: Staff = {
        id: tempId,
        userId: tempId,
        user: { id: tempId, name: normalized.name, email: normalized.email },
        class: normalized.classId ? { id: normalized.classId, name: "" } : null,
        department: normalized.department ? { id: normalized.department, name: normalized.department } : null,
        position: normalized.position,
        salary: normalized.salary,
        subjects: normalized.subjects,
        hireDate: normalized.hireDate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      set((state) => ({
        staffList: [optimisticStaff, ...state.staffList],
        total: state.total + 1,
      }));

      try {
        const newStaff = await apiClient<Staff>("/api/staff", {
          method: "POST",
          body: JSON.stringify(normalized),
        });

        set((state) => ({
          staffList: state.staffList.map((s) => (s.id === tempId ? newStaff : s)),
        }));

        return newStaff;
      } catch (err: any) {
        set((state) => ({
          staffList: state.staffList.filter((s) => s.id !== tempId),
          total: Math.max(0, state.total - 1),
          error: err?.message || "Failed to create staff",
        }));
        return null;
      } finally {
        set({ loading: false });
      }
    },

    updateStaff: async (id, payload) => {
      set({ loading: true, error: null });
      const normalized = normalizeStaffPayload({ ...payload } as StaffPayload);
      const prevStaff = get().staffList.find((s) => s.id === id);
      if (!prevStaff) return null;

      const optimisticStaff = { ...prevStaff, ...normalized };
      set((state) => ({
        staffList: state.staffList.map((s) => (s.id === id ? optimisticStaff : s)),
        selectedStaff: state.selectedStaff?.id === id ? optimisticStaff : state.selectedStaff,
      }));

      try {
        const updated = await apiClient<Staff>(`/api/staff/${id}`, {
          method: "PUT",
          body: JSON.stringify(normalized),
        });

        set((state) => ({
          staffList: state.staffList.map((s) => (s.id === id ? updated : s)),
          selectedStaff: state.selectedStaff?.id === id ? updated : state.selectedStaff,
        }));

        return updated;
      } catch (err: any) {
        set((state) => ({
          staffList: state.staffList.map((s) => (s.id === id ? prevStaff : s)),
          selectedStaff: state.selectedStaff?.id === id ? prevStaff : state.selectedStaff,
          error: err?.message || "Failed to update staff",
        }));
        return null;
      } finally {
        set({ loading: false });
      }
    },

    deleteStaff: async (id: string) => {
      set({ loading: true, error: null });
      const prevStaff = get().staffList.find((s) => s.id === id);
      if (!prevStaff) return;

      set((state) => ({
        staffList: state.staffList.filter((s) => s.id !== id),
        selectedStaff: state.selectedStaff?.id === id ? null : state.selectedStaff,
        total: Math.max(0, state.total - 1),
      }));

      try {
        await apiClient(`/api/staff/${id}`, { method: "DELETE" });
      } catch (err: any) {
        set((state) => ({
          staffList: [prevStaff, ...state.staffList],
          total: state.total + 1,
          error: err?.message || "Failed to delete staff",
        }));
      } finally {
        set({ loading: false });
      }
    },

    totalPages: () => Math.ceil(get().total / get().perPage),
  };
});

// /* 
// Design reasoning → Centralized state for Staff management, handling user-first creation, optimistic UI, rollback safety, filtering, search, pagination, caching, and role inference.

// Structure → Zustand store with staffList, selectedStaff, pagination, filters, loading, error, cache; includes methods for fetch, fetchById, create, update, delete.

// Implementation guidance → Always normalize payloads with class/subject inference. Use optimistic updates for smoother UX and rollback on error. Debounce searches to reduce network load.

// Scalability insight → Easily extendable with additional relations, new fields, or roles. Separation of User + Staff payload allows future-proof expansions and multi-school support.

// Example usage:
// ```ts
// const { staffList, fetchStaff, createStaff } = useStaffStore();
// useEffect(() => { fetchStaff(); }, []);
// await createStaff({ name: "Alice", email: "alice@school.com", password: "secret", position: "TEACHER", classId: "class-1", subjects: ["Math"] });
