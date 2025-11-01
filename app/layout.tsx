// app/layout.tsx
import "./globals.css";
import { ReactNode } from "react";
import { Inter } from "next/font/google";
import { Toaster } from "sonner"; // ✅ import Toaster
import AppBackground from "./components/AppBackground";
import SchoolFooter from "./components/home/SchoolFooter";
import BackToTop from "./components/home/BackToTop";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Ford School Management",
  description: "Single-tenant school management system",
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full text-neutral-dark`}>
        {/* Background wrapper */}
        <AppBackground>{children}</AppBackground>

        {/* Global footer */}
        <SchoolFooter />

        {/* Scroll helper */}
        <BackToTop />

        {/* 🔔 Toast notifications */}
        <Toaster position="top-right" richColors closeButton duration={4000} />
      </body>
    </html>
  );
}
