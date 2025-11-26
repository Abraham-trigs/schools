// app/store/useAuthStore.ts
"use client";

import { create } from "zustand";
import api from "@/lib/axios.ts";

// ------------------ TYPES ------------------
export interface School {
  id: string;
  name: string;
  domain: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  school: School;
}

interface AuthError {
  type: "login" | "logout" | "fetchMe" | "refresh" | null;
  message: string;
}

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;

  loading: {
    login: boolean;
    logout: boolean;
    refresh: boolean;
    fetchMe: boolean;
  };

  error: AuthError | null;

  // ------------------ ACTIONS ------------------
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refresh: () => Promise<boolean>;
  fetchMe: () => Promise<boolean>;
  fetchUser: () => Promise<boolean>;
  setUser: (user: User | null) => void;
}

// ------------------ ZUSTAND STORE ------------------
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoggedIn: false,
  loading: {
    login: false,
    logout: false,
    refresh: false,
    fetchMe: false,
  },
  error: null,

  // ------------------ Login ------------------
  login: async (email: string, password: string) => {
    set({ loading: { ...get().loading, login: true }, error: null });
    try {
      const res = await api.post("/auth/login", { email, password });
      if (res.status === 200) {
        const user: User = res.data.user;
        set({ user, isLoggedIn: true });
        return true;
      }
      set({ error: { type: "login", message: "Login failed" } });
      return false;
    } catch (err: any) {
      set({
        error: {
          type: "login",
          message: err?.response?.data?.error || "Login failed",
        },
      });
      return false;
    } finally {
      set({ loading: { ...get().loading, login: false } });
    }
  },

  // ------------------ Logout ------------------
  logout: async () => {
    set({ loading: { ...get().loading, logout: true }, error: null });
    try {
      await api.post("/auth/logout");
      set({ user: null, isLoggedIn: false });
    } catch (err: any) {
      console.error("Logout error:", err);
      set({
        error: { type: "logout", message: "Logout failed" },
      });
    } finally {
      set({ loading: { ...get().loading, logout: false } });
    }
  },

  // ------------------ Refresh JWT ------------------
  refresh: async () => {
    set({ loading: { ...get().loading, refresh: true } });
    try {
      const res = await api.post("/auth/refresh");
      return res.status === 200;
    } catch (err: any) {
      set({ user: null, isLoggedIn: false });
      return false;
    } finally {
      set({ loading: { ...get().loading, refresh: false } });
    }
  },

  // ------------------ Fetch current user ------------------
  fetchMe: async () => {
    set({ loading: { ...get().loading, fetchMe: true }, error: null });
    try {
      const res = await api.get("/auth/me");
      if (res.status === 200) {
        set({ user: res.data.user, isLoggedIn: true });
        return true;
      }
      set({ user: null, isLoggedIn: false });
      return false;
    } catch (err: any) {
      set({ user: null, isLoggedIn: false });
      set({
        error: { type: "fetchMe", message: "Failed to fetch user" },
      });
      return false;
    } finally {
      set({ loading: { ...get().loading, fetchMe: false } });
    }
  },

  // ------------------ Ensure user is fetched ------------------
  fetchUser: async () => {
    // Tries to fetchMe, refreshes silently if 401
    const me = await get().fetchMe();
    if (!me) {
      const refreshed = await get().refresh();
      if (refreshed) return await get().fetchMe();
      return false;
    }
    return true;
  },

  // ------------------ Set user manually ------------------
  setUser: (user: User | null) => {
    set({ user, isLoggedIn: !!user });
  },
}));
