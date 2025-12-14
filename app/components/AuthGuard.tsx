"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/app/store/useAuthStore.ts";

interface AuthGuardProps {
  children: ReactNode;
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
      if (!user) {
        // only fetch if no user in store
        const isAuth = await fetchUser();
        if (!mounted) return;

        if (!isAuth && redirectOnFail) {
          router.replace("/auth/login");
        } else {
          setVerified(true);
        }
      } else {
        setVerified(true); // already have user
      }
    };

    verify();

    return () => {
      mounted = false;
    };
  }, [user, fetchUser, redirectOnFail, router]);

  if ((loading.fetchMe && !user) || !verified) {
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
