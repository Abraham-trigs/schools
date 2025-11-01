"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

interface NavbarProps {
  onAboutClick?: () => void;
  onGalleryClick?: () => void;
  onHomeClick?: () => void;
  onContactClick?: () => void;
  activePage?: "home" | "gallery" | "about" | "contact";
}

export default function Navbar({
  onGalleryClick,
  onHomeClick,
  onAboutClick,
  onContactClick,
  activePage = "home",
}: NavbarProps) {
  const [open, setOpen] = useState(false);

  const links = [
    { label: "Home", action: onHomeClick },
    { label: "Gallery", action: onGalleryClick },
    { label: "About", action: onAboutClick },
    { label: "Contact", action: onContactClick },
  ];

  const isActive = (label: string) => {
    if (label === "Home") return activePage === "home";
    if (label === "Gallery") return activePage === "gallery";
    if (label === "About") return activePage === "about";
    if (label === "Contact") return activePage === "contact";
    return false;
  };

  const renderLink = (link: (typeof links)[0]) => {
    const commonClasses =
      "transition-colors relative px-4 py-2 rounded-md font-medium";
    const activeClasses =
      "bg-[var(--ford-card)] text-[var(--warning)] font-semibold";
    const hoverClasses = "hover:text-[var(--warning)]";

    if (link.action) {
      return (
        <button
          key={link.label}
          onClick={() => {
            setOpen(false);
            link.action?.();
          }}
          className={`${commonClasses} ${
            isActive(link.label) ? activeClasses : hoverClasses
          }`}
        >
          {link.label}
        </button>
      );
    } else {
      return (
        <Link
          key={link.label}
          href={link.href!}
          onClick={() => setOpen(false)}
          className={`${commonClasses} ${
            isActive(link.label) ? activeClasses : hoverClasses
          }`}
        >
          {link.label}
        </Link>
      );
    }
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-[var(--ford-primary)]/20 hover:bg-[var(--ford-primary)]/50 backdrop-blur-sm font-extrabold  text-[var(--ford-primary)]  transition-all duration-300">
      <div className="flex items-center justify-between max-w-7xl mx-auto px-6 py-4">
        {/* Logo */}
        <button
          onClick={() => {
            setOpen(false);
            onHomeClick?.();
          }}
          className="text-2xl font-bold tracking-wide"
        >
          Ford<span className="text-[var(--ford-warning)]">School</span>
        </button>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {links.map(renderLink)}
          <Link
            href="/auth/login"
            className="bg-[var(--ford-secondary)] hover:bg-[var(--neutral-dark)] text-[var(--typo)] px-4 py-2 rounded-lg transition-colors"
          >
            Login
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 text-[var(--typo)]"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden bg-[var(--ford-primary)] border-t border-[var(--ford-secondary)] px-6 py-4 space-y-4">
          {links.map((link) => {
            const active = isActive(link.label);
            return link.action ? (
              <button
                key={link.label}
                onClick={() => {
                  setOpen(false);
                  link.action?.();
                }}
                className={`block w-full text-left p-2 rounded-md ${
                  active
                    ? "bg-[var(--ford-card)] text-[var(--warning)] font-semibold"
                    : "hover:text-[var(--warning)]"
                }`}
              >
                {link.label}
              </button>
            ) : (
              <Link
                key={link.label}
                href={link.href!}
                onClick={() => setOpen(false)}
                className={`block p-2 rounded-md ${
                  active
                    ? "bg-[var(--ford-card)] text-[var(--warning)] font-semibold"
                    : "hover:text-[var(--warning)]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            href="/auth/login"
            onClick={() => setOpen(false)}
            className="block bg-[var(--ford-secondary)] hover:bg-[var(--neutral-dark)] text-center text-[var(--typo)] px-4 py-2 rounded-lg"
          >
            Login
          </Link>
        </div>
      )}
    </nav>
  );
}
