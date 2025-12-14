"use client";

import { create } from "zustand";
import api from "@/lib/axios.ts";

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

  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refresh: () => Promise<boolean>;
  fetchMe: () => Promise<boolean>;
  fetchUser: () => Promise<boolean>;
  fetchUserOnce: () => Promise<boolean>;
  setUser: (user: User | null) => void;
}

// ------------------ SINGLETON FLAG ------------------
let initialized = false;

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

  login: async (email, password) => {
    set({ loading: { ...get().loading, login: true }, error: null });
    try {
      const res = await api.post("/auth/login", { email, password });
      if (res.status === 200) {
        set({ user: res.data.user, isLoggedIn: true });
        return true;
      }
      set({ error: { type: "login", message: "Login failed" } });
      return false;
    } catch (err: any) {
      set({
        error: { type: "login", message: err?.response?.data?.error || "Login failed" },
      });
      return false;
    } finally {
      set({ loading: { ...get().loading, login: false } });
    }
  },

  logout: async () => {
    set({ loading: { ...get().loading, logout: true }, error: null });
    try {
      await api.post("/auth/logout");
      set({ user: null, isLoggedIn: false });
    } catch (err) {
      set({ error: { type: "logout", message: "Logout failed" } });
    } finally {
      set({ loading: { ...get().loading, logout: false } });
    }
  },

  refresh: async () => {
    set({ loading: { ...get().loading, refresh: true } });
    try {
      const res = await api.post("/auth/refresh");
      return res.status === 200;
    } catch {
      set({ user: null, isLoggedIn: false });
      return false;
    } finally {
      set({ loading: { ...get().loading, refresh: false } });
    }
  },

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
    } catch {
      set({ user: null, isLoggedIn: false });
      return false;
    } finally {
      set({ loading: { ...get().loading, fetchMe: false } });
    }
  },

  fetchUser: async () => {
    const me = await get().fetchMe();
    if (!me) {
      const refreshed = await get().refresh();
      if (refreshed) return await get().fetchMe();
      return false;
    }
    return true;
  },

  // ------------------ NEW: fetch only once ------------------
  fetchUserOnce: async () => {
    if (initialized) return !!get().user;
    initialized = true;
    return await get().fetchUser();
  },

  setUser: (user) => set({ user, isLoggedIn: !!user }),
}));
