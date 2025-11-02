// app/components/Topbar.tsx
// Purpose: Fixed, mobile-first topbar that dynamically aligns with Sidebar width

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, LogOut, ChevronDown, Menu } from "lucide-react";
import clsx from "clsx";
import axios from "axios";
import { useTopbarStore } from "@/app/store/useTopbarStore";
import { useUserStore } from "@/app/store/useUserStore";
import { useSidebarStore } from "@/app/store/useSidebarStore";

const formatTimestamp = (ts: string) =>
  new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export default function Topbar() {
  const router = useRouter();
  const { user, clearUser } = useUserStore();
  const { isOpen: sidebarOpen, toggle: toggleSidebar } = useSidebarStore();
  const {
    notifications,
    notificationsOpen,
    profileOpen,
    toggleNotifications,
    toggleProfile,
    closeAll,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    unreadCount,
  } = useTopbarStore();

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});

  const DESKTOP_WIDTH = 768;
  const CLOSED_WIDTH = 64;
  const OPEN_WIDTH = 256;

  useEffect(() => {
    const updateStyle = () => {
      const isDesktop = window.innerWidth >= DESKTOP_WIDTH;
      if (isDesktop) {
        setStyle({
          left: sidebarOpen ? OPEN_WIDTH : CLOSED_WIDTH,
          width: `calc(100% - ${sidebarOpen ? OPEN_WIDTH : CLOSED_WIDTH}px)`,
          transition: "left 0.3s ease, width 0.3s ease",
        });
      } else {
        setStyle({ left: 0, width: "100%" });
      }
    };
    updateStyle();
    window.addEventListener("resize", updateStyle);
    return () => window.removeEventListener("resize", updateStyle);
  }, [sidebarOpen]);

  const handleLogout = async () => {
    try {
      await axios.post("/api/auth/logout");
      clearUser();
      closeAll();
      router.push("/auth/login");
    } catch (err) {
      console.error("Logout failed:", err);
      alert("Logout failed. Please try again.");
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClickOrEsc = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent && e.key !== "Escape") return;
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node) &&
        notifRef.current &&
        !notifRef.current.contains(e.target as Node)
      ) {
        closeAll();
      }
    };
    document.addEventListener("mousedown", handleClickOrEsc);
    document.addEventListener("keydown", handleClickOrEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOrEsc);
      document.removeEventListener("keydown", handleClickOrEsc);
    };
  }, [closeAll]);

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U";

  return (
    <header
      style={style}
      // supports-[backdrop-filter]:bg-[#a50b0b]/20 shadow-md hover:bg-[#570404] bg-white/10 border-b border-white/20 backdrop-blur-3xl supports-[backdrop-filter]:backdrop-blur-md
      className="fixed top-0 right-0 z-50 flex items-center justify-between
                 px-4 py-3 text-white
                   
                 
                 transition-all duration-300"
    >
      <button
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
        className="p-2 rounded hover:bg-ford-secondary transition-colors md:hidden"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="text- font- tracking-wide truncate p-3 py-1 rounded-xl bg-ford-">
        {/* Dashboard */}
      </div>

      <div className=" hover:supports-[backdrop-filter]:bg-ford-secondary hover:supports-[backdrop-filter]:backdrop-blur-md hover:transition-all duration-1000 flex items-center gap-4 relative rounded-2xl px-3  backdrop-blur-3xl  hover:shadow-xl">
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            aria-label="Notifications"
            onClick={toggleNotifications}
            className="relative p-2 rounded hover:bg-ford- transition-colors"
          >
            <Bell className="w-5 h-5 text-ford-secondary " />
            {unreadCount() > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-ford-secondary text-white text-xs rounded-full flex items-center justify-center font-">
                {unreadCount()}
              </span>
            )}
          </button>

          <div
            className={clsx(
              "absolute right-0 mt-2 w-72 max-h-80 bg-ford-primary text- rounded shadow-lg border-ford-secondary overflow-y-auto transition-all duration-200 origin-top",
              notificationsOpen
                ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
            )}
          >
            <div className="flex justify-between items-center px-4 py-2 border-b border-ford-secondary ">
              <span className="font- text-">Notifications</span>
              <button
                className="text-xs text- hover:underline"
                onClick={markAllAsRead}
              >
                Mark all read
              </button>
            </div>
            {notifications.length === 0 ? (
              <p className="p-4 text-sm text-gray-500">No new notifications</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={clsx(
                    "px-4 py-2 bg-ford-primary hover:bg-gray-100 cursor-pointer flex justify-between items-center",
                    !n.read && "bg-gray-200 font-"
                  )}
                  onClick={() => markAsRead(n.id)}
                >
                  <span className="text-sm font-extralight ">{n.message}</span>
                  <span className="text-xs text-gray-500">
                    {formatTimestamp(n.timestamp)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={toggleProfile}
            className="flex items-center gap-2 p-2 rounded  transition-colors "
            aria-haspopup="menu"
            aria-expanded={profileOpen}
          >
            <div className="w-6 h-6 bg-ford-secondary text-ford-primary/0 rounded-full flex items-center justify-center text-xs font-semibold">
              {userInitials}
            </div>
            <span className="hidden md:inline text-ford-secondary font-medium">
              {user?.name || "User"}
            </span>
            <ChevronDown
              className={clsx(
                "w-4 h-4 transition-transform text-ford-secondary duration-200",
                profileOpen && "rotate-180"
              )}
            />
          </button>

          <div
            className={clsx(
              "absolute right-0 mt-2 w-44 bg-ford-primary text- rounded shadow-lg py-2 border border-ford-secondary transition-all duration-200 origin-top",
              profileOpen
                ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
            )}
            role="menu"
          >
            <button
              className="w-full text-left px-4 py-2 hover:bg-ford-secondary"
              onClick={() => router.push("/profile")}
            >
              Profile
            </button>
            <button
              className="w-full flex items-center text- gap-2 text-left px-4 py-2 hover:bg-ford-secondary "
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 " /> Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
