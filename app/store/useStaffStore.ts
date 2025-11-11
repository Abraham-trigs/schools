// app/store/useStaffStore.ts
// Purpose: Zustand store for managing Staff data, including CRUD operations, pagination, and redirect support after deletion.

"use client";

import { create } from "zustand";
import { debounce } from "lodash";
import { apiClient } from "@/lib/apiClient";
import { useClassesStore } from "./useClassesStore";

// --- Types ---
export interface Staff {
  id: string;
  userId: string;
  user: { id: string; name: string; email: string; phone?: string };
  class?: { id: string; name: string; students?: any[] } | null;
  department?: { id: string; name: string } | null;
  position?: string | null;
  salary?: number | null;
  subject?: string | null;
  hireDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UserPayload {
  name: string;
  email: string;
  password: string;
  role?: string;
}

interface StaffPayload {
  position?: string;
  department?: string;
  classId?: string | null;
  salary?: number | null;
  subject?: string | null;
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

  createStaff: (user: UserPayload, staff: StaffPayload) => Promise<Staff | null>;
  updateStaff: (id: string, data: Partial<Staff>) => void;
  deleteStaff: (id: string, onDeleted?: () => void) => Promise<void>;

  totalPages: () => number;
}

// --- Store Definition ---
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

    // --- Fetch paginated staff list ---
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

    // --- Fetch individual staff ---
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
        set((state) => ({
          staffList: [fetched, ...state.staffList.filter((s) => s.id !== id)],
        }));
        return fetched;
      } catch (err: any) {
        set({ error: err?.message || "Failed to fetch staff by id" });
        return null;
      } finally {
        set({ loading: false });
      }
    },

    // --- Create staff ---
    createStaff: async (userPayload, staffPayload) => {
      set({ loading: true, error: null });
      try {
        const newStaff = await apiClient<Staff>("/api/staff", {
          method: "POST",
          body: JSON.stringify({ ...userPayload, ...staffPayload }),
        });
        set((state) => ({
          staffList: [newStaff, ...state.staffList],
          total: state.total + 1,
        }));
        return newStaff;
      } catch (err: any) {
        set({ error: err?.error?.message || err?.message || "Failed to create staff" });
        return null;
      } finally {
        set({ loading: false });
      }
    },

    // --- Update staff in store (optimistic) ---
    updateStaff: (id, data) => {
      set((state) => {
        const updatedList = state.staffList.map((s) =>
          s.id === id ? { ...s, ...data } : s
        );
        const updatedSelected =
          state.selectedStaff?.id === id
            ? { ...state.selectedStaff, ...data }
            : state.selectedStaff;
        return {
          staffList: updatedList,
          selectedStaff: updatedSelected || null,
          cache: Object.fromEntries(
            Object.entries(state.cache).map(([k, list]) => [
              k,
              list.map((s) => (s.id === id ? { ...s, ...data } : s)),
            ])
          ),
        };
      });
    },

    // --- Delete staff with callback ---
    deleteStaff: async (id: string, onDeleted?: () => void) => {
      set({ loading: true, error: null });
      try {
        const res = await apiClient<{ success: boolean; error?: any }>(`/api/staff/${id}`, {
          method: "DELETE",
        });

        if (res.success) {
          set((state) => ({
            staffList: state.staffList.filter((s) => s.id !== id),
            selectedStaff: state.selectedStaff?.id === id ? null : state.selectedStaff,
            total: Math.max(0, state.total - 1),
            cache: Object.fromEntries(
              Object.entries(state.cache).map(([k, list]) => [
                k,
                list.filter((s) => s.id !== id),
              ])
            ),
          }));
          if (onDeleted) onDeleted(); // callback safely after state update
        } else {
          set({ error: res.error?.message || "Failed to delete staff" });
        }
      } catch (err: any) {
        set({ error: err?.message || "Failed to delete staff" });
      } finally {
        set({ loading: false });
      }
    },

    totalPages: () => Math.ceil(get().total / get().perPage),
  };
});
