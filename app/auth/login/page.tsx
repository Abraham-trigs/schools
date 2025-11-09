"use client";

import { useState } from "react";
import axios from "axios";
import clsx from "clsx";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore.ts";

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
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
      setLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen ">
      {/* Background Image */}
      <Image
        src="/main-4.webp"
        alt="Ford School"
        fill
        className="object-cover object-top -z-10 blur-sm"
        priority
      />
      <div className="absolute inset-0 -z-0"></div>

      {/* Login Form */}
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
            disabled={loading}
            className={clsx(
              "p-2 rounded text-white font-semibold transition-colors",
              loading
                ? "bg-ford-secondary opacity-70 cursor-not-allowed"
                : "bg-ford-primary hover:bg-ford-secondary"
            )}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white/70">
          &copy; {new Date().getFullYear()} Ford School
        </p>
      </div>
    </div>
  );
}
