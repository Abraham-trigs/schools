import { ReactNode } from "react";
import Sidebar from "@/app/components/Sidebar";
import Topbar from "@/app/components/Topbar";
import { cookieUser } from "@/lib/cookieUser";
import { Providers } from "../providers"; // 🔄 hydrate store

interface DashboardLayoutProps {
  children: ReactNode;
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  // 🔒 Fetch user on the server
  const user = await cookieUser();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500">
        Not authenticated
      </div>
    );
  }

  return (
    <Providers user={user}>
      <div className="flex h-screen">
        <Sidebar role={user.role} />
        <div className="flex-1 flex flex-col">
          <Topbar user={user} />
          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </Providers>
  );
}
