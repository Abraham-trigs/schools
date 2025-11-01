// components/common/LoaderModal.tsx
"use client";

import { ReactNode } from "react";

interface LoaderModalProps {
  text?: string; // optional custom text
  isVisible: boolean; // controls whether the modal shows
  children?: ReactNode; // optional children (like extra animations)
}

export default function LoaderModal({
  text = "Loading...",
  isVisible,
  children,
}: LoaderModalProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="flex flex-col items-center justify-centerrounded-lg p-6 ">
        <h1 className="text-4xl font-thin text-lightGrey mb-6 animate-pulse">
          {text}
        </h1>
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-greener border-t-transparent animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-4 border-accentPurple border-b-transparent animate-spin-slow"></div>
        </div>
        {children && <div className="mt-4">{children}</div>}
      </div>
    </div>
  );
}
