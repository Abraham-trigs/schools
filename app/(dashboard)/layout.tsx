// app/dashboard/layout.tsx
// Purpose: Fixed Sidebar + Topbar; handles responsive layout and auth state

"use client";

import { ReactNode, useEffect } from "react";
import Sidebar from "@/app/components/Sidebar";
import Topbar from "@/app/components/Topbar";
import { useSidebarStore } from "@/app/store/useSidebarStore.ts";
import { useAuthStore } from "@/app/store/useAuthStore.ts";
import { useRouter } from "next/navigation";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isOpen } = useSidebarStore();
  const sidebarWidth = isOpen ? 256 : 64;

  const { user, fetchUser, loading, error } = useAuthStore();
  const router = useRouter();

  // ------------------ Fetch auth user on mount ------------------
  useEffect(() => {
    const initializeAuth = async () => {
      const fetched = await fetchUser();
      if (!fetched) {
        router.push("/auth/login"); // Redirect to login if unauthenticated
      }
    };
    initializeAuth();
  }, [fetchUser, router]);

  // ------------------ Loading or error handling ------------------
  if (loading.fetchMe || loading.refresh) {
    return (
      <div className="flex items-center justify-center h-screen w-screen">
        <span className="text-lg font-medium text-gray-600">Loading...</span>
      </div>
    );
  }

  if (!user) {
    return null; // Already redirecting; avoid flashing layout
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-gradient-to-br from-ford-primary/20 to-ford-secondary/10 backdrop-blur-md">
      {/* Sidebar fixed at top-left */}
      <Sidebar />

      {/* Main content container */}
      <div
        className="flex flex-col flex-1 transition-all duration-300"
        style={{ marginLeft: sidebarWidth }}
      >
        {/* Topbar dynamically adjusts width */}
        <Topbar />

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8 mt-1">
          {children}
        </main>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                            Design reasoning                                 */
/* -------------------------------------------------------------------------- */
/*
- DashboardLayout now integrates auth store directly.
- Fetches current user on mount, ensures auth state before rendering main UI.
- Redirects unauthenticated users to login to protect UX and sensitive content.
- Keeps Sidebar and Topbar layout intact, reacting to sidebar open/close state.
*/

/* -------------------------------------------------------------------------- */
/*                                 Structure                                   */
/* -------------------------------------------------------------------------- */
/*
- Uses Zustand stores for Sidebar (`useSidebarStore`) and Auth (`useAuthStore`).
- React effect runs once on mount to fetch current user and refresh JWT if necessary.
- Conditional render: loading screen while fetching, null to avoid flashing layout if user is unauthenticated.
- Main layout remains flex container with responsive sidebar width.
*/

/* -------------------------------------------------------------------------- */
/*                         Implementation guidance                             */
/* -------------------------------------------------------------------------- */
/*
- Ensure /auth/login route exists and handles unauthenticated redirects.
- Can extend `DashboardLayout` to show error banners if `error` exists in auth store.
- Sidebar and Topbar can read `user` for role-based UI rendering.
- Loading state covers both `fetchMe` and `refresh` to prevent flicker.
*/

/* -------------------------------------------------------------------------- */
/*                          Scalability insight                                */
/* -------------------------------------------------------------------------- */
/*
- Layout can now be reused across multiple dashboard pages safely.
- Fetching user once and storing in Zustand avoids repeated API calls.
- Future: can integrate role-based route protection here.
- Adding global error boundaries or toast notifications would integrate smoothly with existing `error` state.
*/
