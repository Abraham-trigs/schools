// app/store/useUserStore.ts
"use client";

import { create } from "zustand";
import { z } from "zod";
import axios from "axios";
import { useAuthStore } from "@/app/store/useAuthStore.ts";

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
  createUser: (payload: CreateUserPayload) => Promise<User | false>;
  updateUser: (id: string, payload: Partial<User>) => Promise<User | false>;
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
    const schoolId = useAuthStore.getState().user?.school.id;
    if (!schoolId) throw new Error("Unauthorized: School ID missing");

    try {
      const res = await axios.get("/api/users", {
        headers: { "X-School-ID": schoolId },
        params: { search, page, limit },
      });

      const parsed = userListResponseSchema.parse(res.data);
      set({ users: parsed.data, pagination: parsed.pagination });
    } catch (err: any) {
      console.error("fetchUsers error:", err?.response?.data || err?.message || err);
      set({ users: [], pagination: { total: 0, page: 1, limit, pages: 1 } });
    }
  },

  // ------------------- Create User -------------------
  createUser: async (payload: CreateUserPayload) => {
    const schoolId = useAuthStore.getState().user?.school.id;
    if (!schoolId) throw new Error("Unauthorized: School ID missing");

    try {
      const res = await axios.post("/api/users", payload, {
        headers: { "X-School-ID": schoolId },
      });

      const parsed = userSchema.parse(res.data);
      set((state) => ({ users: [parsed, ...state.users] }));
      return parsed;
    } catch (err: any) {
      console.error("createUser error:", err?.response?.data || err?.message || err);
      return false;
    }
  },

  // ------------------- Update User -------------------
  updateUser: async (id, payload) => {
    const schoolId = useAuthStore.getState().user?.school.id;
    if (!schoolId) throw new Error("Unauthorized: School ID missing");

    try {
      const res = await axios.put(`/api/users/${id}`, payload, {
        headers: { "X-School-ID": schoolId },
      });

      const parsed = userSchema.parse(res.data);
      set((state) => ({
        users: state.users.map((u) => (u.id === id ? parsed : u)),
      }));
      return parsed;
    } catch (err: any) {
      console.error("updateUser error:", err?.response?.data || err?.message || err);
      return false;
    }
  },

  // ------------------- Delete User -------------------
  deleteUser: async (id) => {
    const schoolId = useAuthStore.getState().user?.school.id;
    if (!schoolId) throw new Error("Unauthorized: School ID missing");

    try {
      await axios.delete(`/api/users/${id}`, {
        headers: { "X-School-ID": schoolId },
      });
      set((state) => ({ users: state.users.filter((u) => u.id !== id) }));
    } catch (err: any) {
      console.error("deleteUser error:", err?.response?.data || err?.message || err);
      throw err;
    }
  },
}));
