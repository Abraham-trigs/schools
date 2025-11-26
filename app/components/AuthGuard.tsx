// app/components/AuthGuard.tsx
"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/app/store/useAuthStore.ts";

interface AuthGuardProps {
  children: ReactNode;
  /** If true, will redirect to /login when unauthenticated */
  redirectOnFail?: boolean;
}

export default function AuthGuard({
  children,
  redirectOnFail = true,
}: AuthGuardProps) {
  const router = useRouter();
  const { user, fetchUser, loading } = useAuthStore();
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    let mounted = true;

    const verify = async () => {
      const isAuth = await fetchUser(); // fetchUser handles refresh automatically
      if (!mounted) return;

      if (!isAuth && redirectOnFail) {
        router.replace("/login");
      } else {
        setVerified(true);
      }
    };

    verify();

    return () => {
      mounted = false;
    };
  }, [fetchUser, redirectOnFail, router]);

  // Show loading until auth is verified
  if (loading.fetchMe || !verified) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex justify-center items-center h-full min-h-screen"
      >
        <p>Checking authentication...</p>
      </div>
    );
  }

  return <>{children}</>;
}
