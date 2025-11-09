// app/components/Sidebar.tsx
// Purpose: Fixed, collapsible sidebar with role-based navigation

"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  Home,
  Users,
  Settings,
  Book,
  BarChart2,
  BookOpen,
  FileText,
  Archive,
} from "lucide-react";
import { useSidebarStore } from "@/store/useSidebarStore.ts";
import { useUserStore } from "@/store/useUserStore.ts";

export type Role = "ADMIN" | "TEACHER" | "STUDENT" | "PARENT";

const rolePermissions: Record<Role, string[]> = {
  ADMIN: [
    "dashboard",
    "students",
    "staff",
    "classes",
    "exams",
    "finance",
    "library",
    "sessions",
    "reports",
    "settings",
  ],
  TEACHER: ["dashboard", "students", "exams", "reports"],
  STUDENT: ["dashboard", "courses", "exams"],
  PARENT: ["dashboard", "children"],
};

const menuItems = [
  { label: "Dashboard", icon: Home, key: "dashboard", href: "/dashboard" },
  { label: "Classes", icon: Book, key: "classes", href: "/dashboard/classes" },
  {
    label: "Students",
    icon: Users,
    key: "students",
    href: "/dashboard/students",
  },
  { label: "Staff", icon: Users, key: "staff", href: "/dashboard/staff" },
  { label: "Exams", icon: BookOpen, key: "exams", href: "/dashboard/exams" },
  {
    label: "Finance",
    icon: FileText,
    key: "finance",
    href: "/dashboard/finance",
  },
  {
    label: "Library",
    icon: Archive,
    key: "library",
    href: "/dashboard/library",
  },
  {
    label: "School Sessions",
    icon: Settings,
    key: "sessions",
    href: "/dashboard/sessions",
  },
  {
    label: "Reports",
    icon: BarChart2,
    key: "reports",
    href: "/dashboard/reports",
  },
  {
    label: "Settings",
    icon: Settings,
    key: "settings",
    href: "/dashboard/settings",
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isOpen, toggle } = useSidebarStore();
  const { user } = useUserStore();
  const role: Role = (user?.role as Role) || "ADMIN";

  const allowedItems = menuItems.filter((item) =>
    rolePermissions[role].includes(item.key)
  );

  return (
    <motion.aside
      initial={{ width: 64 }}
      animate={{ width: isOpen ? 256 : 64 }}
      transition={{ type: "spring", stiffness: 250, damping: 25 }}
      className="fixed top-0 left-0 bottom-0 z-40
                 bg-ford-primary text-white flex flex-col
                 border-r border-ford-secondary"
    >
      {/* Sidebar header */}
      <div className="flex items-center justify-between py-4 px-3 border-b border-ford-secondary">
        {isOpen && (
          <span className="text-xl font-bold truncate">Ford School</span>
        )}
        <button
          onClick={toggle}
          className="text-white p-1 hover:bg-ford-secondary rounded-md"
          aria-label="Toggle Sidebar"
        >
          {isOpen ? "⯈" : "⯇"}
        </button>
      </div>

      {/* Scrollable nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {allowedItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.key}
              href={item.href}
              className={clsx(
                "group flex items-center gap-4 px-3 py-2 rounded transition-colors",
                isActive
                  ? "bg-ford-secondary font-semibold"
                  : "hover:bg-ford-secondary",
                !isOpen && "justify-center"
              )}
              title={!isOpen ? item.label : undefined}
            >
              <item.icon className="w-5 h-5" />
              {isOpen && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-ford-secondary flex items-center justify-center bg-ford-primary">
        {isOpen ? (
          <span className="text-sm text-white/70">
            © {new Date().getFullYear()} Ford School
          </span>
        ) : (
          <span className="text-xs text-white/70">
            {user?.role?.[0] || "U"}
          </span>
        )}
      </div>
    </motion.aside>
  );
}
