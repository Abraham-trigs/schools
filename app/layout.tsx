// app/layout.tsx
// Purpose: Global site layout with glass background, footer, scroll helper, notifications, and optional auth guard.

import "./globals.css";
import { ReactNode } from "react";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";

import AppBackground from "./components/AppBackground";
import FooterWrapper from "@/app/components/home/FooterWrapper";
import BackToTop from "./components/home/BackToTop";
import AuthGuard from "@/app/components/AuthGuard";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Ford School Management",
  description: "Single-tenant school management system",
};

interface RootLayoutProps {
  children: ReactNode;
  /** Wrap layout in AuthGuard for protected routes */
  requireAuth?: boolean;
}

export default function RootLayout({
  children,
  requireAuth = false,
}: RootLayoutProps) {
  const content = (
    <>
      {/* Main content with glass-like background */}
      <AppBackground>{children}</AppBackground>

      {/* Footer */}
      <FooterWrapper />

      {/* Scroll helper */}
      <BackToTop />

      {/* Global notifications */}
      <Toaster position="top-right" richColors closeButton duration={4000} />
    </>
  );

  // Wrap in AuthGuard if required
  return (
    <html lang="en" className="h-full">
      <body
        className={`${inter.className} h-full text-neutral-dark overflow-x-hidden`}
      >
        {requireAuth ? <AuthGuard>{content}</AuthGuard> : content}
      </body>
    </html>
  );
}
