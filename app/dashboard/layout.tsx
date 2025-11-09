// app/dashboard/layout.tsx
// Purpose: Fixed Sidebar + Topbar; handles auth, session, auto-fetch, auto-revalidate, clears on 401, and redirects to login

"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar.tsx";
import Topbar from "@/components/Topbar.tsx";
import { useAuthStore } from "@/store/useAuthStore.ts";
import { useSidebarStore } from "@/store/useSidebarStore.ts";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const { user, fetchUser, loading, fetchAttempted } = useAuthStore();
  const { isOpen } = useSidebarStore();
  const sidebarWidth = isOpen ? 256 : 64;

  // Hydrate user session on mount
  useEffect(() => {
    fetchUser(); // auto-fetch if not loaded
  }, [fetchUser]);

  // Redirect unauthenticated users to login after fetch attempt
  useEffect(() => {
    if (!loading && fetchAttempted && user === null) {
      router.replace("/auth/login");
    }
  }, [user, loading, fetchAttempted, router]);

  // Show loading until fetch completes
  if (loading || user === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        Loading session...
      </div>
    );
  }

  if (!user) {
    return null; // prevent layout render before redirect
  }

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

/*
Design reasoning:
- Prevents redirect before first fetch.
- Loading screen improves UX.
- Layout renders only for authenticated users.

Structure:
- fetchUser on mount.
- Redirect effect depends on fetchAttempted flag.
- Sidebar + Topbar + content.

Implementation guidance:
- Keep fetchAttempted in store.
- Use this layout for all protected routes.

Scalability insight:
- Adding role-based redirects or multi-tenant support is straightforward via store.
*/
