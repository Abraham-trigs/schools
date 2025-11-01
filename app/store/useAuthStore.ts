"use client";

import { create } from "zustand";
import axios from "axios";
import { User } from "@/app/types/user";

interface UserStore {
  user: User | null;
  loading: boolean;
  fetchUser: () => Promise<void>;
  setUser: (user: User | null) => void;
  clearUser: () => void;
}

export const useAuthStore = create<UserStore>((set, get) => ({
  user: null,
  loading: false,

  fetchUser: async () => {
    const { user, loading } = get();
    if (user || loading) return;

    set({ loading: true });
    try {
      const res = await axios.get<{ user: User }>("/api/auth/me", {
        withCredentials: true,
      });
      set({ user: res.data.user, loading: false });
    } catch (err) {
      console.error("❌ Failed to fetch user", err);
      set({ user: null, loading: false });
    }
  },

  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));
