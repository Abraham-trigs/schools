// app/store/useAuthStore.ts
// Purpose: Fully synced client-side auth store managing user state, auto-fetch, auto-revalidate, and automatic logout on 401

"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import axios, { AxiosError } from "axios";
import { User } from "@/app/types/user";

interface AuthStore {
  user: User | null | undefined; // undefined = not fetched yet
  loading: boolean;
  error: string | null;
  fetchAttempted: boolean;

  fetchUser: () => Promise<void>;
  revalidateUser: () => Promise<void>;
  setUser: (user: User | null) => void;
  clearUser: () => void;
}

const AUTO_REVALIDATE_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export const useAuthStore = create<AuthStore>()(
  devtools((set, get) => {
    let intervalId: NodeJS.Timer | null = null;

    const handleAxiosError = (err: unknown) => {
      let message = "An unknown error occurred";
      if (axios.isAxiosError(err)) {
        const axiosErr = err as AxiosError<{ error: string }>;
        message = axiosErr.response?.data?.error || err.message;

        // Auto-clear user on 401 (unauthorized)
        if (axiosErr.response?.status === 401) {
          clearUser();
        }
      }
      return message;
    };

    const fetchUser = async () => {
      const { user, loading } = get();
      if (user || loading) return;
      set({ loading: true, error: null });
      try {
        const res = await axios.get<{ user: User }>("/api/auth/me", { withCredentials: true });
        set({ user: res.data.user, loading: false, fetchAttempted: true });
      } catch (err) {
        const message = handleAxiosError(err);
        console.error("❌ Failed to fetch user", message);
        set({ user: null, loading: false, error: message, fetchAttempted: true });
      }
    };

    const revalidateUser = async () => {
      set({ loading: true, error: null });
      try {
        const res = await axios.get<{ user: User }>("/api/auth/me", { withCredentials: true });
        set({ user: res.data.user, loading: false, fetchAttempted: true });
      } catch (err) {
        const message = handleAxiosError(err);
        console.error("❌ Failed to revalidate user", message);
        set({ user: null, loading: false, error: message, fetchAttempted: true });
      }
    };

    const setUser = (user: User | null) => set({ user, error: null, fetchAttempted: true });
    const clearUser = () => set({ user: null, loading: false, error: null, fetchAttempted: true });

    // Auto-revalidate on tab focus
    if (typeof window !== "undefined") {
      window.addEventListener("focus", () => {
        revalidateUser().catch(() => {});
      });
      intervalId = setInterval(() => {
        revalidateUser().catch(() => {});
      }, AUTO_REVALIDATE_INTERVAL_MS);
    }

    return {
      user: undefined,
      loading: false,
      error: null,
      fetchAttempted: false,
      fetchUser,
      revalidateUser,
      setUser,
      clearUser,
    };
  })
);

/*
Design reasoning:
- `undefined` signals "not fetched yet" to avoid premature redirects.
- Auto-revalidate ensures session stays alive.
- fetchAttempted prevents redirect before first API call.
- Error handling and 401 logout protects UX.

Structure:
- user, loading, error, fetchAttempted: state.
- fetchUser, revalidateUser: async actions.
- setUser, clearUser: state setters.

Implementation guidance:
- Import store in layouts or pages.
- Call fetchUser on mount.
- Use revalidateUser on focus or interval.

Scalability insight:
- Can add refresh token handling or multiple user roles without changing layout logic.
*/
