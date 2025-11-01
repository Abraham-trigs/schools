// components/Topbar.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, User, LogOut, ChevronDown } from "lucide-react";
import clsx from "clsx";
import axios from "axios";

export default function Topbar() {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const router = useRouter();
  const profileRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    try {
      await axios.post("/api/auth/logout");
      setIsProfileOpen(false);
      router.push("auth/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
        setIsNotificationOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="flex items-center justify-between bg-ford-card text-white px-4 py-3 shadow-md relative z-50">
      {/* Left - Page Title / Breadcrumb */}
      <div className="text-lg font-semibold">Dashboard</div>

      {/* Right - Notifications & Profile */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            className="relative p-2 rounded hover:bg-ford-secondary transition-colors"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-0 right-0 inline-block w-2 h-2 bg-warning rounded-full"></span>
          </button>

          {isNotificationOpen && (
            <div
              className={clsx(
                "absolute right-0 mt-2 w-64 bg-white text-black rounded shadow-lg p-4 border border-ford-secondary transition-all duration-200 ease-out",
                isNotificationOpen
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 -translate-y-2"
              )}
            >
              <p className="text-sm">No new notifications</p>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 p-2 rounded hover:bg-ford-secondary transition-colors"
          >
            <User className="w-5 h-5" />
            <span className="hidden md:inline">Admin</span>
            <ChevronDown
              className={clsx(
                "w-4 h-4 transition-transform duration-200",
                isProfileOpen && "rotate-180"
              )}
            />
          </button>

          <div
            className={clsx(
              "absolute right-0 mt-2 w-44 bg-white text-black rounded shadow-lg py-2 border border-ford-secondary transition-all duration-200 ease-out origin-top",
              isProfileOpen
                ? "opacity-100 scale-100 translate-y-0"
                : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
            )}
          >
            <button
              className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded transition-colors"
              onClick={() => {
                setIsProfileOpen(false);
                router.push("/profile");
              }}
            >
              Profile
            </button>

            <button
              className="w-full flex items-center gap-2 text-left px-4 py-2 hover:bg-gray-100 rounded transition-colors text-red-600"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
