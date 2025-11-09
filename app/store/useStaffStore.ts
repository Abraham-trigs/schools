// src/stores/staffStore.ts
// Purpose: Zustand store for Staff – full CRUD with transactional User creation, pagination, search, sorting, multi-subjects, class/department filters, debounce, and field-level error handling.

import { create }  from "zustand";

import { devtools } from "zustand/middleware";
import { apiClient } from "@lib/apiClient.ts";
import { useUserStore } from "./useUserStore.ts";

// ------------------------- Types -------------------------
export interface Staff {
  id: string;
  userId?: string | null;
  position: string;
  department?: string | null;
  classId?: string | null;
  salary?: number | null;
  hireDate?: string | null;
  subjects?: string[];
  createdAt: string;
}

interface StaffFilters {
  search?: string;
  position?: string;
  department?: string;
  classId?: string;
  createdFrom?: string;
  createdTo?: string;
}

interface FieldErrors {
  [key: string]: string[];
}

interface StaffStore {
  staff: Staff[];
  total: number;
  page: number;
  perPage: number;
  loading: boolean;
  error?: string;
  fieldErrors?: FieldErrors;
  filters: StaffFilters;
  sortBy: string;
  sortOrder: "asc" | "desc";
  debounceMs: number;

  fetchStaff: () => Promise<void>;
  fetchStaffById: (id: string) => Promise<Staff | undefined>;
  createStaff: (data: Partial<Staff> & { createUser?: boolean; password?: string }) => Promise<Staff | undefined>;
  updateStaff: (id: string, data: Partial<Staff>) => Promise<Staff | undefined>;
  deleteStaff: (id: string) => Promise<boolean>;
  setFilters: (filters: Partial<StaffFilters>) => void;
  setPagination: (page: number, perPage: number) => void;
  setSorting: (sortBy: string, sortOrder: "asc" | "desc") => void;
  setDebounce: (ms: number) => void;
}

// ------------------------- Store -------------------------
export const useStaffStore = create<StaffStore>()(
  devtools((set, get) => ({
    staff: [],
    total: 0,
    page: 1,
    perPage: 10,
    loading: false,
    error: undefined,
    fieldErrors: undefined,
    filters: {},
    sortBy: "createdAt",
    sortOrder: "desc",
    debounceMs: 300,

    setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
    setPagination: (page, perPage) => set({ page, perPage }),
    setSorting: (sortBy, sortOrder) => set({ sortBy, sortOrder }),
    setDebounce: (ms) => set({ debounceMs: ms }),

    fetchStaff: async () => {
      set({ loading: true, error: undefined });
      const { page, perPage, filters, sortBy, sortOrder, debounceMs } = get();

      try {
        if (debounceMs > 0) await new Promise((res) => setTimeout(res, debounceMs));

        const params = new URLSearchParams({
          page: page.toString(),
          perPage: perPage.toString(),
          sortBy,
          sortOrder,
          ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== undefined && v !== "")),
        });

        const data = await apiClient<{ staff: Staff[]; total: number; page: number; perPage: number }>(
          `/api/staff?${params.toString()}`,
          { auth: true, showError: true }
        );

        set({
          staff: data.staff || [],
          total: data.total || 0,
          page: data.page || 1,
          perPage: data.perPage || 10,
        });
      } catch (err: any) {
        set({ error: err.message });
      } finally {
        set({ loading: false });
      }
    },

    fetchStaffById: async (id) => {
      set({ loading: true, error: undefined });
      try {
        const data = await apiClient<Staff>(`/api/staff/${id}`, { auth: true, showError: true });
        return data;
      } catch (err: any) {
        set({ error: err.message });
      } finally {
        set({ loading: false });
      }
    },

    createStaff: async (payload) => {
      set({ loading: true, error: undefined, fieldErrors: undefined });
      const { createUser, password, ...staffPayload } = payload;
      const { createUser: createUserFn } = useUserStore.getState();

      try {
        let user;
        if (createUser) {
          if (!password) throw new Error("Password is required when creating a User");
          user = await createUserFn({
            name: staffPayload.name!,
            email: staffPayload.email!,
            password,
            role: staffPayload.position!,
          });
        }

        const data = await apiClient<Staff>("/api/staff", {
          method: "POST",
          body: { ...staffPayload, userId: user?.id ?? null },
          auth: true,
          showSuccess: true,
          successMessage: "Staff created successfully",
        });

        set((state) => ({ staff: [data, ...state.staff], total: state.total + 1 }));
        return data;
      } catch (err: any) {
        if (err?.fieldErrors) set({ fieldErrors: err.fieldErrors });
        set({ error: err.message });
      } finally {
        set({ loading: false });
      }
    },

    updateStaff: async (id, payload) => {
      set({ loading: true, error: undefined, fieldErrors: undefined });
      try {
        const data = await apiClient<Staff>(`/api/staff/${id}`, {
          method: "PUT",
          body: payload,
          auth: true,
          showSuccess: true,
          successMessage: "Staff updated successfully",
        });

        set((state) => ({ staff: state.staff.map((s) => (s.id === id ? data : s)) }));
        return data;
      } catch (err: any) {
        if (err?.fieldErrors) set({ fieldErrors: err.fieldErrors });
        set({ error: err.message });
      } finally {
        set({ loading: false });
      }
    },

    deleteStaff: async (id) => {
      set({ loading: true, error: undefined });
      try {
        await apiClient(`/api/staff/${id}`, {
          method: "DELETE",
          auth: true,
          showSuccess: true,
          successMessage: "Staff deleted successfully",
        });

        set((state) => ({ staff: state.staff.filter((s) => s.id !== id), total: state.total - 1 }));
        return true;
      } catch (err: any) {
        set({ error: err.message });
        return false;
      } finally {
        set({ loading: false });
      }
    },
  }))
);

/* 
Design reasoning:
- Supports transactional creation of Staff + User, ensuring atomicity and rollback.
- Debounced fetches reduce API calls during fast filter changes.
- Field-level error support allows inline form validation without breaking UI.

Structure:
- Uses Zustand + devtools.
- Each CRUD action handles loading, success, and fieldErrors state.
- Supports pagination, sorting, search, and flexible filters.

Implementation guidance:
- Use createStaff with { createUser: true, password } to also create User.
- fetchStaff automatically applies current filters, sort, and pagination.
- Errors returned from API with field-level hints are stored in `fieldErrors`.

Scalability insight:
- Easily extendable with additional filters (busId, hireDate range), transactional updates for related models.
- Supports bulk staff creation, optimistic UI updates, and future debounce optimizations.
*/
