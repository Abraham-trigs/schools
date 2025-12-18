// app/layout.tsx
// Purpose: Global site layout with glass background, footer, scroll helper, notifications, global async queue, and optional auth guard.

import "./globals.css";
import { ReactNode } from "react";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";

import AppBackground from "./components/AppBackground.tsx";
import FooterWrapper from "@/app/components/home/FooterWrapper.tsx";
import BackToTop from "./components/home/BackToTop.tsx";
import AuthGuard from "@/app/components/AuthGuard.tsx";

import {
  AsyncActionQueueProvider,
  GlobalActionProgress,
} from "@/context/AsyncActionQueueProvider";

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
      {/* Wrap children in AsyncActionQueueProvider to enable global loader */}
      <AsyncActionQueueProvider>
        {/* Optional: global loading progress bar */}
        <GlobalActionProgress />

        {/* Main content with glass-like background */}
        <AppBackground>{children}</AppBackground>

        {/* Footer */}
        <FooterWrapper />

        {/* Scroll helper */}
        <BackToTop />

        {/* Global notifications */}
        <Toaster position="top-right" richColors closeButton duration={4000} />
      </AsyncActionQueueProvider>
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

/*
Design reasoning:
- Wrap entire layout in AsyncActionQueueProvider to ensure any component using QueueAwareLoaderButton or runAsync has access to global loader context.
- GlobalActionProgress provides combined skeleton/progress UI across the app.
- Toaster remains at top-level to show notifications triggered from stores or components.

Structure:
- AsyncActionQueueProvider wraps all children content
- AppBackground, Footer, BackToTop, and Toaster remain inside provider
- AuthGuard conditional wrapping retained

Implementation guidance:
- Any page/component using QueueAwareLoaderButton or runAsync automatically benefits from global loading, skeletons, and notifications.
- Provider at root avoids repeating wrappers on individual pages.

Scalability insight:
- Centralized async queue supports multiple concurrent actions app-wide.
- Global progress bar ensures consistent UX.
- Adding additional global providers (theme, error boundary) can coexist inside this layout.
*/
