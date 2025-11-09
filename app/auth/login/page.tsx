// app/auth/login/page.tsx
// Purpose: Login page that redirects to dashboard if already authenticated

"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import clsx from "clsx";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore.ts";

export default function LoginPage() {
  const router = useRouter();
  const { user, fetchUser, setUser, loading } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.replace("/dashboard");
    } else if (user === undefined) {
      fetchUser().catch(() => {});
    }
  }, [user, fetchUser, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalLoading(true);
    setError("");

    try {
      const res = await axios.post<{ user: any }>(
        "/api/auth/login",
        { email, password },
        { withCredentials: true }
      );

      // Update AuthStore immediately
      setUser(res.data.user);

      // Redirect to dashboard
      router.replace("/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Login failed");
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen">
      <Image
        src="/main-4.webp"
        alt="Ford School"
        fill
        className="object-cover object-top -z-10 blur-sm"
        priority
      />
      <div className="absolute inset-0 -z-0"></div>

      <div className="relative w-full max-w-md p-8 bg-ford-card rounded-lg shadow-2xs z-10">
        <h1 className="text-3xl font-bold text-center text-white mb-6">
          Ford School
        </h1>

        {error && (
          <div className="bg-warning text-text px-4 py-2 rounded mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="p-2 rounded bg-background border border-ford-primary focus:outline-none focus:ring-2 focus:ring-ford-secondary"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="p-2 rounded bg-background border border-ford-primary focus:outline-none focus:ring-2 focus:ring-ford-secondary"
          />
          <button
            type="submit"
            disabled={localLoading || loading}
            className={clsx(
              "p-2 rounded text-white font-semibold transition-colors",
              localLoading || loading
                ? "bg-ford-secondary opacity-70 cursor-not-allowed"
                : "bg-ford-primary hover:bg-ford-secondary"
            )}
          >
            {localLoading || loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white/70">
          &copy; {new Date().getFullYear()} Ford School
        </p>
      </div>
    </div>
  );
}

/*
Design reasoning:
- Redirects already-authenticated users immediately to dashboard.
- Uses store fetchUser to hydrate auth state if undefined.
- Local loading separates UI state from global auth loading.

Structure:
- useEffect checks user on mount and redirects.
- handleSubmit manages login and updates store.
- Login form with inline validation and loading states.

Implementation guidance:
- Drop into /app/auth/login/page.tsx
- Ensure useAuthStore has fetchUser implemented with fetchAttempted logic.

Scalability insight:
- Can extend to support role-based redirects or "remember me" functionality without breaking UX.
*/
