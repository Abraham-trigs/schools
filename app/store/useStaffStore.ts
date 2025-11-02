// app/store/useStaffStore.ts
// Purpose: Zustand store for Staff management with centralized class data from useClassesStore

"use client";

import { create } from "zustand"; 
import { debounce } from "lodash";
import { apiClient } from "@/lib/apiClient.ts"; 
import { useClassesStore } from "./useClassesStore"; // <-- centralized class store

export interface Staff {
  id: string;
  userId: string;
  user: { id: string; name: string; email: string };
  class?: { id: string; name: string } | null;
  department?: { id: string; name } | null;
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

  fetchStaff: (page?: number, search?: string) => Promise<void>;
  fetchStaffDebounced: (page?: number, search?: string) => void;

  createStaff: (user: UserPayload, staff: StaffPayload) => Promise<Staff | null>;
  updateStaff: (id: string, data: Partial<Staff>) => void;
  deleteStaff: (id: string) => void;

  totalPages: () => number;
}

export const useStaffStore = create<StaffState>((set, get) => {
  const fetchStaffDebounced = debounce((page?: number, search?: string) => {
    get().fetchStaff(page, search);
  }, 300);

  return {
    staffList: [],
    total: 0,
    page: 1,
    perPage: 10,
    search: "",
    loading: false,
    error: null,
    cache: {},

    setPage: (page) => set({ page }),
    setPerPage: (perPage) => set({ perPage }),
    setSearch: (search: string) => {
      set({ search });
      fetchStaffDebounced(1, search);
      set({ page: 1 });
    },

    fetchStaff: async (page = get().page, search = get().search) => {
      const cached = get().cache[page];
      if (cached && search === "") {
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

    createStaff: async (userPayload: UserPayload, staffPayload: StaffPayload) => {
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

    updateStaff: (id, data) => {
      set((state) => ({
        staffList: state.staffList.map((s) => (s.id === id ? { ...s, ...data } : s)),
        cache: Object.fromEntries(
          Object.entries(state.cache).map(([k, list]) => [
            k,
            list.map((s) => (s.id === id ? { ...s, ...data } : s)),
          ])
        ),
      }));
    },

    deleteStaff: (id) => {
      set((state) => ({
        staffList: state.staffList.filter((s) => s.id !== id),
        total: state.total - 1,
        cache: Object.fromEntries(
          Object.entries(state.cache).map(([k, list]) => [
            k,
            list.filter((s) => s.id !== id),
          ])
        ),
      }));
    },

    totalPages: () => Math.ceil(get().total / get().perPage),
  };
});
