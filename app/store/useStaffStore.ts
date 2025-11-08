// File: app/store/useStaffStore.ts
// Purpose: Production-ready Zustand store for Staff management with full CRUD, pagination, search, filtering, caching, backend-aligned inference, optimistic updates, validation, and rollback safety.

"use client";

import { create } from "zustand";
import { debounce } from "lodash";
import { z } from "zod";
import { apiClient } from "@/lib/apiClient";
import { requiresClass } from "@/lib/api/constants/roleInference";

// ------------------------- Types -------------------------
export interface Staff {
  id: string;
  userId: string;
  user: { id: string; name: string; email: string };
  class?: { id: string; name: string } | null;
  department?: { id: string; name: string } | null;
  position?: string | null;
  salary?: number | null;
  subject?: string | null;
  hireDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StaffPayload {
  name: string;
  email: string;
  password?: string;
  position?: string | null;
  classId?: string | null;
  salary?: number | null;
  subject?: string | null;
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
  // Debounced fetch for live search/filtering
  const fetchStaffDebounced = debounce((page?: number, search?: string) => {
    get().fetchStaff(page, search);
  }, 300);

  // Payload normalization & basic validation using Zod
  const normalizePayload = (payload: StaffPayload) => {
    const schema = z.object({
      name: z.string().min(1),
      email: z.string().email(),
      password: z.string().optional(),
      position: z.string().optional(),
      classId: z.string().nullable().optional(),
      salary: z.number().nullable().optional(),
      subject: z.string().nullable().optional(),
      hireDate: z.string().nullable().optional(),
    });
    const parsed = schema.parse(payload);
    return {
      ...parsed,
      name: parsed.name.trim(),
      email: parsed.email.trim(),
      position: parsed.position ?? "Teacher",
      classId: requiresClass(parsed.position) ? parsed.classId ?? null : null,
      salary: parsed.salary ?? null,
      subject: parsed.subject ?? null,
      hireDate: parsed.hireDate ?? null,
    };
  };

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

        // Merge updated staff across all cached pages
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

    // ------------------------- Fetch single staff -------------------------
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

        // Update all cached pages
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

    // ------------------------- Create staff -------------------------
    createStaff: async (payload: StaffPayload) => {
      set({ loading: true, error: null });
      const normalized = normalizePayload(payload);

      // Optimistic update with temporary ID
      const tempId = `temp-${Date.now()}`;
      const optimisticStaff: Staff = {
        id: tempId,
        userId: tempId,
        user: { id: tempId, name: normalized.name!, email: normalized.email! },
        class: normalized.classId ? { id: normalized.classId, name: "" } : null,
        department: null,
        position: normalized.position,
        salary: normalized.salary,
        subject: normalized.subject,
        hireDate: normalized.hireDate ?? new Date().toISOString(),
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

    // ------------------------- Update staff -------------------------
    updateStaff: async (id, payload) => {
      set({ loading: true, error: null });
      const normalizedPayload = {
        ...payload,
        position: payload.position ?? undefined,
        classId: requiresClass(payload.position) ? payload.classId ?? null : null,
      };
      const prevStaff = get().staffList.find((s) => s.id === id);
      if (!prevStaff) return null;

      // Optimistic update
      const optimisticStaff = { ...prevStaff, ...normalizedPayload };
      set((state) => ({
        staffList: state.staffList.map((s) => (s.id === id ? optimisticStaff : s)),
        selectedStaff: state.selectedStaff?.id === id ? optimisticStaff : state.selectedStaff,
      }));

      try {
        const updated = await apiClient<Staff>(`/api/staff/${id}`, {
          method: "PUT",
          body: JSON.stringify(normalizedPayload),
        });

        set((state) => ({
          staffList: state.staffList.map((s) => (s.id === id ? updated : s)),
          selectedStaff: state.selectedStaff?.id === id ? updated : state.selectedStaff,
        }));

        return updated;
      } catch (err: any) {
        // Rollback
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

    // ------------------------- Delete staff -------------------------
    deleteStaff: async (id: string) => {
      set({ loading: true, error: null });
      const prevStaff = get().staffList.find((s) => s.id === id);
      if (!prevStaff) return;

      // Optimistic delete
      set((state) => ({
        staffList: state.staffList.filter((s) => s.id !== id),
        selectedStaff: state.selectedStaff?.id === id ? null : state.selectedStaff,
        total: Math.max(0, state.total - 1),
      }));

      try {
        await apiClient(`/api/staff/${id}`, { method: "DELETE" });
      } catch (err: any) {
        // Rollback
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

/* -------------------------
Design reasoning → Fully mirrors API with optimistic updates, rollback safety, search, filtering, pagination, caching, and normalized payloads. Ensures responsive UI with consistent backend state.
Structure → State: staffList, selectedStaff, pagination, search, filters, loading, error, cache. Actions handle fetch, fetchById, create, update, delete, with debounced search and merged cache.
Implementation guidance → Use normalizePayload for validation; fetchStaffDebounced for live search/filter; optimistic updates with rollback; atomic createStaff with temporary IDs; merges staff across cached pages.
Scalability insight → Extendable for additional relations, filters, roles, inferred fields, and multi-step transactions; optimistic pattern reusable for other stores; clean separation of state, actions, and helpers ensures maintainability.
*/
