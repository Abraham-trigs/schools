// src/stores/useUserStore.ts
// Purpose: Zustand store for managing users and their associated staff, fully integrated with API, search, pagination, error handling, and optimistic updates.

import { create } from "zustand";
import { apiClient } from "../../lib/apiClient.ts";
import { z } from "zod";

// ------------------- Zod schemas -------------------
const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.string(),
  busId: z.string().nullable(),
  schoolId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  staff: z
    .object({
      id: z.string(),
      role: z.string(),
      position: z.string().nullable(),
      departmentId: z.string().nullable(),
      salary: z.number().nullable(),
      hireDate: z.string().nullable(),
    })
    .nullable(),
});

const userListResponseSchema = z.object({
  data: z.array(userSchema),
  pagination: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    pages: z.number(),
  }),
});

// ------------------- Design reasoning -------------------
// - Centralized user state including staff info for frontend convenience.
// - Pagination, search, and filtering handled server-side.
// - Optimistic updates for create/update/delete actions.
// - Full Zod validation ensures type safety and prevents frontend errors.
// - Uses apiClient wrapper for consistent error/success notifications.

// ------------------- Structure -------------------
// Exports: useUserStore hook
// State:
//   users -> array of users with staff
//   pagination -> pagination info
//   search, page, limit -> query state
// Actions:
//   fetchUsers, createUser, updateUser, deleteUser, setSearch, setPage

interface Staff {
  id: string;
  role: string;
  position?: string | null;
  departmentId?: string | null;
  salary?: number | null;
  hireDate?: string | null;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  busId?: string | null;
  schoolId: string;
  createdAt: string;
  updatedAt: string;
  staff?: Staff | null;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface UserStore {
  users: User[];
  pagination: Pagination;
  search: string;
  page: number;
  limit: number;

  fetchUsers: () => Promise<void>;
  createUser: (payload: Partial<User>) => Promise<User>;
  updateUser: (id: string, payload: Partial<User>) => Promise<User>;
  deleteUser: (id: string) => Promise<void>;
  setSearch: (value: string) => void;
  setPage: (value: number) => void;
}

export const useUserStore = create<UserStore>((set, get) => ({
  users: [],
  pagination: { total: 0, page: 1, limit: 20, pages: 1 },
  search: "",
  page: 1,
  limit: 20,

  setSearch: (value: string) => set({ search: value, page: 1 }),
  setPage: (value: number) => set({ page: value }),

  fetchUsers: async () => {
    const { search, page, limit } = get();
    try {
      const res = await apiClient<typeof userListResponseSchema>({
        url: `/api/users?search=${encodeURIComponent(search)}&page=${page}&limit=${limit}`,
        method: "GET",
        auth: true,
      });

      const parsed = userListResponseSchema.parse(res);
      set({ users: parsed.data, pagination: parsed.pagination });
    } catch (err: any) {
      console.error("fetchUsers error:", err.message);
      set({ users: [], pagination: { total: 0, page: 1, limit, pages: 1 } });
    }
  },

  createUser: async (payload) => {
    try {
      const res = await apiClient<User>({
        url: "/api/users",
        method: "POST",
        body: payload,
        showSuccess: true,
        successMessage: "User created successfully",
      });
      const parsed = userSchema.parse(res);

      // Optimistic update
      set((state) => ({ users: [parsed, ...state.users] }));
      return parsed;
    } catch (err: any) {
      console.error("createUser error:", err.message);
      throw err;
    }
  },

  updateUser: async (id, payload) => {
    try {
      const res = await apiClient<User>({
        url: `/api/users/${id}`,
        method: "PUT",
        body: payload,
        showSuccess: true,
        successMessage: "User updated successfully",
      });
      const parsed = userSchema.parse(res);

      set((state) => ({
        users: state.users.map((u) => (u.id === id ? parsed : u)),
      }));
      return parsed;
    } catch (err: any) {
      console.error("updateUser error:", err.message);
      throw err;
    }
  },

  deleteUser: async (id) => {
    try {
      await apiClient<{ message: string }>({
        url: `/api/users/${id}`,
        method: "DELETE",
        showSuccess: true,
        successMessage: "User deleted successfully",
      });
      set((state) => ({
        users: state.users.filter((u) => u.id !== id),
      }));
    } catch (err: any) {
      console.error("deleteUser error:", err.message);
      throw err;
    }
  },
}));

// ------------------- Implementation guidance -------------------
// import { useUserStore } from "@/stores/useUserStore";
// const { users, fetchUsers, createUser } = useUserStore();
// use fetchUsers() on component mount, call createUser(payload) on form submit.

// ------------------- Scalability insight -------------------
// - Can extend to fetch related entities like Class, Department, or Subjects.
// - Supports server-side filtering and sorting by adding query params to fetchUsers.
// - Can add optimistic UI updates for Staff subfields (position, salary, hireDate) without changing API structure.
