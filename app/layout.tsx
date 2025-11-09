// app/layout.tsx
import "./globals.css";
import { ReactNode } from "react";
import { Toaster } from "sonner";
import AppBackground from "./components/AppBackground";
import FooterWrapper from "./components/home/FooterWrapper.tsx";
import BackToTop from "./components/home/BackToTop.tsx";

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
      <head>
        {/* Google Fonts: Lexend */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Lexend:wght@400;700&display=swap"
        />
      </head>
      <body className="font-sans h-full text-neutral-dark overflow-x-hidden">
        <AppBackground>{children}</AppBackground>
        <FooterWrapper />
        <BackToTop />
        <Toaster position="top-right" richColors closeButton duration={4000} />
      </body>
    </html>
  );
}
