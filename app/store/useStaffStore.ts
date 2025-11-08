// app/store/useStaffStore.ts
// Purpose: Zustand store for managing Staff with full CRUD, pagination, search (debounced), caching, and role/class logic.

"use client";

import { create } from "zustand";
import { debounce } from "lodash";
import { apiClient } from "@/lib/apiClient.ts";
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

interface StaffPayload {
  name: string;
  email: string;
  password?: string;
  position?: string | null;
  classId?: string | null;
  salary?: number | null;
  subject?: string | null;
  hireDate?: string | null;
}

interface StaffState {
  staffList: Staff[];
  selectedStaff: Staff | null;
  total: number;
  page: number;
  perPage: number;
  search: string;
  loading: boolean;
  error: string | null;
  cache: Record<number, Staff[]>;

  setPage: (page: number) => void;
  setPerPage: (perPage: number) => void;
  setSearch: (search: string) => void;

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
  const fetchStaffDebounced = debounce((page?: number, search?: string) => {
    get().fetchStaff(page, search);
  }, 300);

  return {
    staffList: [],
    selectedStaff: null,
    total: 0,
    page: 1,
    perPage: 10,
    search: "",
    loading: false,
    error: null,
    cache: {},

    setPage: (page) => set({ page }),
    setPerPage: (perPage) => set({ perPage }),
    setSearch: (search) => {
      set({ search, page: 1 });
      fetchStaffDebounced(1, search);
    },

    setSelectedStaff: (staff) => set({ selectedStaff: staff }),

    fetchStaff: async (page = get().page, search = get().search) => {
      const cached = get().cache[page];
      if (cached && !search) {
        set({ staffList: cached, page });
        return;
      }
      set({ loading: true, error: null });
      try {
        const data = await apiClient<{ staffList: Staff[]; total: number; page: number }>(
          `/api/staff?search=${encodeURIComponent(search)}&page=${page}&perPage=${get().perPage}`
        );
        set((state) => ({
          staffList: data.staffList,
          total: data.total,
          page: data.page,
          cache: search === "" ? { ...state.cache, [page]: data.staffList } : state.cache,
        }));
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
        set((state) => ({ staffList: [fetched, ...state.staffList.filter((s) => s.id !== id)] }));
        return fetched;
      } catch (err: any) {
        set({ error: err?.message || "Failed to fetch staff by id" });
        return null;
      } finally {
        set({ loading: false });
      }
    },

// Corrected createStaff in useStaffStore
createStaff: async (payload: StaffPayload) => {
  set({ loading: true, error: null });
  try {
    // Flatten payload to match backend StaffCreateRequest
    const body = {
      name: payload.name,
      email: payload.email,
      password: payload.password,
      position: payload.position ?? "TEACHER",
      classId: payload.classId ?? null,
      salary: payload.salary ?? null,
      subject: payload.subject ?? null,
      hireDate: payload.hireDate ?? null,
    };

    const newStaff = await apiClient<Staff>("/api/staff", {
      method: "POST",
      body: JSON.stringify(body),
    });

    set((state) => ({
      staffList: [newStaff, ...state.staffList],
      total: state.total + 1,
    }));

    return newStaff;

  } catch (err: any) {
    // decode and stringify Zod errors if needed
    const errorMessage =
      err?.error?.message ||
      (err?.error && typeof err.error === "object"
        ? JSON.stringify(err.error)
        : err?.message) ||
      "Failed to create staff";
    set({ error: errorMessage });
    return null;
  } finally {
    set({ loading: false });
  }
},


    updateStaff: async (id, payload) => {
      set({ loading: true, error: null });
      try {
        const updated = await apiClient<Staff>(`/api/staff/${id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        set((state) => ({
          staffList: state.staffList.map((s) => (s.id === id ? updated : s)),
          selectedStaff: state.selectedStaff?.id === id ? updated : state.selectedStaff,
        }));
        return updated;
      } catch (err: any) {
        set({ error: err?.message || "Failed to update staff" });
        return null;
      } finally {
        set({ loading: false });
      }
    },

    deleteStaff: async (id) => {
      set({ loading: true, error: null });
      try {
        await apiClient(`/api/staff/${id}`, { method: "DELETE" });
        set((state) => ({
          staffList: state.staffList.filter((s) => s.id !== id),
          selectedStaff: state.selectedStaff?.id === id ? null : state.selectedStaff,
          total: Math.max(0, state.total - 1),
        }));
      } catch (err: any) {
        set({ error: err?.message || "Failed to delete staff" });
      } finally {
        set({ loading: false });
      }
    },

    totalPages: () => Math.ceil(get().total / get().perPage),
  };
});

/* Design reasoning:
- Full CRUD store mirrors backend API, includes debounced search + cache for performance.
- Role/class logic maintained on frontend to support optimistic UI and sensible defaults.
Structure:
- State: staffList, selectedStaff, pagination, search, loading, error, cache
- Actions: fetchStaff, fetchStaffDebounced, fetchStaffById, createStaff, updateStaff, deleteStaff
Implementation guidance:
- Wire search input to setSearch, table/list to staffList, pagination to page/perPage, modals to create/update/delete actions.
Scalability insight:
- Extend filters (department, hireDate, salary range), batch operations, or offline caching without changing core store logic.
*/
