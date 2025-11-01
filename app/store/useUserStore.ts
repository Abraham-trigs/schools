"use client";

import { create } from "zustand";
import { apiClient } from "@/lib/apiClient.ts";

export interface User {
  id: string;
  name: string;
  role: string;
  schoolId: string;
}

interface UserState {
  user: User | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchUser: () => Promise<void>;
  clearUser: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  loading: false,
  error: null,

  fetchUser: async () => {
    // Avoid double fetching
    if (get().user || get().loading) return;

    set({ loading: true, error: null });
    try {
      const data = await apiClient<User>("/api/auth/me", { auth: true });
      set({ user: data });
    } catch (err: any) {
      set({ error: err?.message || "Failed to fetch user" });
    } finally {
      set({ loading: false });
    }
  },

  clearUser: () => set({ user: null, loading: false, error: null }),
}));
