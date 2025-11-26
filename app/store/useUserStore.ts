// src/stores/useUserStore.ts
"use client";

import { create } from "zustand";
import { apiClient } from "@/lib/apiClient";
import { z } from "zod";

// ------------------- Zod Schemas -------------------
const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.string(),
  schoolId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
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

// ------------------- Types -------------------
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  schoolId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role?: string;
}

interface UserStore {
  users: User[];
  pagination: Pagination;
  search: string;
  page: number;
  limit: number;

  fetchUsers: () => Promise<void>;
  createUser: (payload: CreateUserPayload) => Promise<User>;
  updateUser: (id: string, payload: Partial<User>) => Promise<User>;
  deleteUser: (id: string) => Promise<void>;
  setSearch: (value: string) => void;
  setPage: (value: number) => void;
}

// ------------------- Store -------------------
export const useUserStore = create<UserStore>((set, get) => ({
  users: [],
  pagination: { total: 0, page: 1, limit: 20, pages: 1 },
  search: "",
  page: 1,
  limit: 20,

  setSearch: (value: string) => set({ search: value, page: 1 }),
  setPage: (value: number) => set({ page: value }),

  // ------------------- Fetch Users -------------------
  fetchUsers: async () => {
    const { search, page, limit } = get();
    try {
      const res = await apiClient({
        url: `/api/users?search=${encodeURIComponent(search)}&page=${page}&limit=${limit}`,
        method: "GET",
        useSchoolAccount: true, // ensures JWT + school scoping
      });

      const parsed = userListResponseSchema.parse(res);
      set({ users: parsed.data, pagination: parsed.pagination });
    } catch (err: any) {
      console.error("fetchUsers error:", err?.message || err);
      // Reset users & pagination on error
      set({ users: [], pagination: { total: 0, page: 1, limit, pages: 1 } });
    }
  },

  // ------------------- Create User -------------------
  createUser: async (payload: CreateUserPayload) => {
    try {
      const res = await apiClient<User>({
        url: "/api/users",
        method: "POST",
        body: payload,
        useSchoolAccount: true, // SchoolAccount handles scoping
      });

      const parsed = userSchema.parse(res);
      set((state) => ({ users: [parsed, ...state.users] }));
      return parsed;
    } catch (err: any) {
      console.error("createUser error:", err?.message || err);
      throw err;
    }
  },

  // ------------------- Update User -------------------
  updateUser: async (id, payload) => {
    try {
      const res = await apiClient<User>({
        url: `/api/users/${id}`,
        method: "PUT",
        body: payload,
        useSchoolAccount: true, // ensures only scoped updates
        showSuccess: true,
        successMessage: "User updated successfully",
      });

      const parsed = userSchema.parse(res);
      set((state) => ({
        users: state.users.map((u) => (u.id === id ? parsed : u)),
      }));
      return parsed;
    } catch (err: any) {
      console.error("updateUser error:", err?.message || err);
      throw err;
    }
  },

  // ------------------- Delete User -------------------
  deleteUser: async (id) => {
    try {
      await apiClient<{ message: string }>({
        url: `/api/users/${id}`,
        method: "DELETE",
        useSchoolAccount: true,
        showSuccess: true,
        successMessage: "User deleted successfully",
      });
      set((state) => ({ users: state.users.filter((u) => u.id !== id) }));
    } catch (err: any) {
      console.error("deleteUser error:", err?.message || err);
      throw err;
    }
  },
}));
