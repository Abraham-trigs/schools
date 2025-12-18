"use client";

import { ReactNode, useEffect, useState } from "react";
import Sidebar from "@/app/components/Sidebar.tsx";
import Topbar from "@/app/components/Topbar.tsx";
import { useSidebarStore } from "@/app/store/useSidebarStore.ts";
import { useAuthStore } from "@/app/store/useAuthStore.ts";
import { useRouter } from "next/navigation";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isOpen } = useSidebarStore();
  const sidebarWidth = isOpen ? 256 : 64;

  const { fetchUserOnce } = useAuthStore();
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      const ok = await fetchUserOnce();
      if (!mounted) return;

      if (!ok) router.replace("/auth/login");
      setAuthChecked(true);
    };

    checkAuth();
    return () => {
      mounted = false;
    };
  }, [fetchUserOnce, router]);

  // ⚡ Client-only: render nothing until authChecked
  if (typeof window === "undefined" || !authChecked) return null;

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-gradient-to-br from-ford-primary/20 to-ford-secondary/10 backdrop-blur-md">
      <Sidebar />
      <div
        className="flex flex-col flex-1 transition-all duration-300"
        style={{ marginLeft: sidebarWidth }}
      >
        <Topbar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8 mt-1">
          {children}
        </main>
      </div>
    </div>
  );
}
