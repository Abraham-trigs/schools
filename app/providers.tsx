"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/app/store/useAuthStore.ts";

interface ProvidersProps {
  user: any;
  children: React.ReactNode;
}

export function Providers({ user, children }: ProvidersProps) {
  const { setUser } = useAuthStore();

  useEffect(() => {
    if (user) setUser(user);
  }, [user, setUser]);

  return <>{children}</>;
}
