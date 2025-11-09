"use client";

// app/store/useStaffStore.ts
// Purpose: Zustand store for managing Staff data with full CRUD, pagination, search (debounced), caching, and frontend/backend sync.

import { create } from "zustand";
import { debounce } from "lodash";
import { apiClient } from "@/lib/apiClient";

// ------------------------- Types -------------------------
export interface Staff {
  id: string;
  userId: string;
  user: { id: string; name: string; email: string; phone?: string };
  class?: { id: string; name: string; students?: any[] } | null;
  department?: { id: string; name: string } | null;
  position?: string | null;
  salary?: number | null;
  subjects?: { id: string; name: string }[]; // Array to match API
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
  classId?: string | null;
  salary?: number | null;
  hireDate?: string | null;
  subjects?: string[]; // Array of subject IDs to connect
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

  // ------------------------- Actions -------------------------
  setPage: (page: number) => void;
  setPerPage: (perPage: number) => void;
  setSearch: (search: string) => void;

  setSelectedStaff: (staff: Staff | null) => void;
  fetchStaff: (page?: number, search?: string) => Promise<void>;
  fetchStaffDebounced: (page?: number, search?: string) => void;
  fetchStaffById: (id: string) => Promise<Staff | null>;

  createStaff: (user: UserPayload, staff: StaffPayload) => Promise<Staff | null>;
  updateStaff: (id: string, data: Partial<StaffPayload & UserPayload>) => Promise<void>;
  deleteStaff: (id: string, onDeleted?: () => void) => Promise<void>;

  totalPages: () => number;
}

// ------------------------- Store -------------------------
export const useStaffStore = create<StaffState>((set, get) => {
  // Debounced fetch to reduce unnecessary API calls during search
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

    // ------------------------- Fetch paginated staff -------------------------
    fetchStaff: async (page = get().page, search = get().search) => {
      const cached = get().cache[page];
      if (cached && !search) {
        // Use cache if search is empty
        set({ staffList: cached, page });
        return;
      }

      set({ loading: true, error: null });
      try {
        const data = await apiClient<{
          staffList: Staff[];
          total: number;
          page: number;
        }>(`/api/staff?search=${encodeURIComponent(search)}&page=${page}&perPage=${get().perPage}`);

        set((state) => ({
          staffList: data.staffList,
          total: data.total,
          page: data.page,
          // Only cache pages when no search applied
          cache: search === "" ? { ...state.cache, [page]: data.staffList } : state.cache,
        }));
      } catch (err: any) {
        set({ error: err?.message || "Failed to fetch staff" });
      } finally {
        set({ loading: false });
      }
    },

    fetchStaffDebounced,

    // ------------------------- Fetch individual staff -------------------------
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

        // Update staffList and cache
        set((state) => ({
          staffList: [fetched, ...state.staffList.filter((s) => s.id !== id)],
          cache: Object.fromEntries(
            Object.entries(state.cache).map(([k, list]) => [
              k,
              list.map((s) => (s.id === id ? fetched : s)),
            ])
          ),
        }));

        return fetched;
      } catch (err: any) {
        set({ error: err?.message || "Failed to fetch staff by id" });
        return null;
      } finally {
        set({ loading: false });
      }
    },

    // ------------------------- Create staff -------------------------
    createStaff: async (userPayload, staffPayload) => {
      set({ loading: true, error: null });
      try {
        // Combine payloads according to API
        const newStaff = await apiClient<Staff>("/api/staff", {
          method: "POST",
          body: JSON.stringify({ ...userPayload, ...staffPayload }),
        });

        // Optimistic update: add to staffList and increment total
        set((state) => ({
          staffList: [newStaff, ...state.staffList],
          total: state.total + 1,
          // Clear cache to avoid stale data
          cache: {},
        }));

        return newStaff;
      } catch (err: any) {
        set({ error: err?.error?.message || err?.message || "Failed to create staff" });
        return null;
      } finally {
        set({ loading: false });
      }
    },

    // ------------------------- Update staff -------------------------
    updateStaff: async (id, data) => {
      set({ loading: true, error: null });
      try {
        // Optimistic local update
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

        // Send update to API
        await apiClient(`/api/staff/${id}`, {
          method: "PUT",
          body: JSON.stringify(data),
        });

        // Optional: reset cache if needed
      } catch (err: any) {
        set({ error: err?.error?.message || err?.message || "Failed to update staff" });
      } finally {
        set({ loading: false });
      }
    },

    // ------------------------- Delete staff -------------------------
    deleteStaff: async (id, onDeleted) => {
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
          if (onDeleted) onDeleted();
        } else {
          set({ error: res.error?.message || "Failed to delete staff" });
        }
      } catch (err: any) {
        set({ error: err?.message || "Failed to delete staff" });
      } finally {
        set({ loading: false });
      }
    },

    // ------------------------- Helper -------------------------
    totalPages: () => Math.ceil(get().total / get().perPage),
  };
});

/* 
Design reasoning:
- Debounced search + caching ensures fast, responsive UI with large staff lists.
- Optimistic create/update/delete improves perceived performance.
- All state changes reflect backend API behavior for consistency.

Structure:
- fetchStaff/fetchStaffById: fetch paginated or individual staff with cache sync.
- createStaff/updateStaff/deleteStaff: full CRUD with optimistic store updates.
- cache cleared on create/delete to prevent stale pages.

Implementation guidance:
- Connect search input to setSearch(), pagination controls to setPage() and totalPages().
- Send subjects as array of IDs to match API payload structure.
- All actions update store state and cache, keeping frontend synced with backend.

Scalability insight:
- Supports bulk actions, filters (role, department), or relational expansions (e.g., certifications) without major restructuring.
- Cache system allows extension for multi-page prefetching or infinite scrolling.
*/
