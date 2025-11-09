// src/stores/userStore.ts
// Purpose: Zustand store for Users – full CRUD with pagination, search, sorting, debounce, transactional updates, and field-level errors.

import {create} from "zustand";
import { devtools } from "zustand/middleware";
import { apiClient } from "lib/apiClient.ts";
// ------------------------- Types -------------------------
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  busId?: string | null;
  schoolId: string;
  createdAt: string;
}

interface UserFilters {
  search?: string;
  role?: string;
  busId?: string;
  createdFrom?: string;
  createdTo?: string;
}

interface FieldErrors {
  [key: string]: string[];
}

interface UserStore {
  users: User[];
  total: number;
  page: number;
  perPage: number;
  loading: boolean;
  error?: string;
  fieldErrors?: FieldErrors;
  filters: UserFilters;
  sortBy: string;
  sortOrder: "asc" | "desc";
  debounceMs: number;

  fetchUsers: () => Promise<void>;
  fetchUserById: (id: string) => Promise<User | undefined>;
  createUser: (data: Partial<User> & { password: string }) => Promise<User | undefined>;
  updateUser: (id: string, data: Partial<User> & { password?: string }) => Promise<User | undefined>;
  deleteUser: (id: string) => Promise<boolean>;
  setFilters: (filters: Partial<UserFilters>) => void;
  setPagination: (page: number, perPage: number) => void;
  setSorting: (sortBy: string, sortOrder: "asc" | "desc") => void;
  setDebounce: (ms: number) => void;
}

// ------------------------- Store -------------------------
export const useUserStore = create<UserStore>()(
  devtools((set, get) => ({
    users: [],
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

    fetchUsers: async () => {
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

        const data = await apiClient<{ users: User[]; total: number; page: number; perPage: number }>(
          `/api/users?${params.toString()}`,
          { auth: true, showError: true }
        );

        set({
          users: data.users || [],
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

    fetchUserById: async (id) => {
      set({ loading: true, error: undefined });
      try {
        const data = await apiClient<User>(`/api/users/${id}`, { auth: true, showError: true });
        return data;
      } catch (err: any) {
        set({ error: err.message });
      } finally {
        set({ loading: false });
      }
    },

    createUser: async (payload) => {
      set({ loading: true, error: undefined, fieldErrors: undefined });
      try {
        const data = await apiClient<User>("/api/users", {
          method: "POST",
          body: payload,
          auth: true,
          showSuccess: true,
          successMessage: "User created successfully",
        });

        set((state) => ({ users: [data, ...state.users], total: state.total + 1 }));
        return data;
      } catch (err: any) {
        if (err?.fieldErrors) set({ fieldErrors: err.fieldErrors });
        set({ error: err.message });
      } finally {
        set({ loading: false });
      }
    },

    updateUser: async (id, payload) => {
      set({ loading: true, error: undefined, fieldErrors: undefined });
      try {
        const data = await apiClient<User>(`/api/users/${id}`, {
          method: "PUT",
          body: payload,
          auth: true,
          showSuccess: true,
          successMessage: "User updated successfully",
        });

        set((state) => ({ users: state.users.map((u) => (u.id === id ? data : u)) }));
        return data;
      } catch (err: any) {
        if (err?.fieldErrors) set({ fieldErrors: err.fieldErrors });
        set({ error: err.message });
      } finally {
        set({ loading: false });
      }
    },

    deleteUser: async (id) => {
      set({ loading: true, error: undefined });
      try {
        await apiClient(`/api/users/${id}`, {
          method: "DELETE",
          auth: true,
          showSuccess: true,
          successMessage: "User deleted successfully",
        });

        set((state) => ({ users: state.users.filter((u) => u.id !== id), total: state.total - 1 }));
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
- Full CRUD with single-user fetch enables dynamic forms without extra API calls.
- Supports transactional workflows for creating related models (e.g., Staff) together.
- Field-level errors enable inline form validation and UX-friendly messages.

Structure:
- Zustand + devtools for state, pagination, filters, sort, loading/error.
- Actions: fetch, create, update, delete, set filters/pagination/sort/debounce.

Implementation guidance:
- Call createUser({ ...payload, password }) for transactional Staff creation.
- Use fetchUserById(id) to prefill forms.
- Debounced fetch reduces rapid API calls when filters change.

Scalability insight:
- Extendable with additional filters (busId, schoolId, createdAt ranges).
- Supports optimistic updates and transactional server workflows.
- Integrates seamlessly with Staff store for combined User + Staff operations.
*/
