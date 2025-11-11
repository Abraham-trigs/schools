// /app/astire/layout.tsx
// Purpose: Astire workspace layout with sliding Chat + PendingEvents panel

"use client";

import React, { useRef, useState } from "react";
import "./globals.css";
import ChatBox from "@/components/ChatBox";
import PendingEventsSidebar from "@/components/PendingEventsSidebar";

export const metadata = {
  title: "Astire – Gospel AI Workspace",
  description: "Your AI-driven productivity and project hub",
};

export default function AstireLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messageRefs = useRef<Record<string, HTMLDivElement>>({});
  const [highlightedMessageId, setHighlightedMessageId] = useState<
    string | undefined
  >();
  const [isChatOpen, setIsChatOpen] = useState(true);

  return (
    <html lang="en">
      <body className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white min-h-screen flex flex-col">
        <header className="bg-blue-600 dark:bg-blue-800 text-white p-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Astire Workspace</h1>
          <nav className="space-x-4">
            <a href="/astire" className="hover:underline">
              Home
            </a>
            <a href="/astire/goals" className="hover:underline">
              Goals
            </a>
            <a href="/astire/projects" className="hover:underline">
              Projects
            </a>
          </nav>
        </header>

        <main className="flex-1 flex flex-row p-6 gap-4 relative">
          {/* Main page content */}
          <div className="flex-1">{children}</div>

          {/* Chat + PendingEvents Panel */}
          <div
            className={`absolute right-0 top-0 h-full z-20 flex flex-col border-l border-gray-300 dark:border-gray-600 rounded-l-lg overflow-hidden bg-white dark:bg-gray-800 transition-transform duration-300 shadow-xl
              ${isChatOpen ? "translate-x-0 w-96" : "translate-x-full w-96"}
            `}
          >
            <ChatBox
              messageRefs={messageRefs}
              highlightedMessageId={highlightedMessageId}
            />
            <PendingEventsSidebar
              messageRefs={messageRefs}
              onHighlight={(id) => setHighlightedMessageId(id)}
            />
          </div>

          {/* Floating toggle button */}
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="absolute top-1/2 -right-6 transform -translate-y-1/2 bg-blue-600 dark:bg-blue-800 text-white px-2 py-1 rounded-l-md shadow-lg hover:bg-blue-700 transition-colors z-30"
            aria-label={
              isChatOpen ? "Collapse chat panel" : "Expand chat panel"
            }
          >
            {isChatOpen ? ">" : "<"}
          </button>
        </main>

        <footer className="bg-gray-200 dark:bg-gray-800 p-4 text-center text-sm">
          &copy; {new Date().getFullYear()} Gospel – Astire AI Workspace
        </footer>
      </body>
    </html>
  );
}

/*
Design reasoning:
- Uses `translate-x-full` for hidden panel and `translate-x-0` for visible panel for smooth sliding effect.
- Absolute positioning ensures panel overlays content without shrinking main area.
- Toggle button floats outside panel for easy access.

Structure:
- Panel remains mounted at all times; only transforms are animated.
- Transition duration 300ms for smooth slide.
- z-index ensures panel is above main content, toggle button above panel.

Implementation guidance:
- Can tweak `transition-transform` duration for faster/slower slide.
- Optional: Add a semi-transparent backdrop behind panel when open to focus attention.
- Works with existing ChatBox + PendingEventsSidebar without changes.

Scalability insight:
- Slide-in panel approach allows multiple stacked panels in future.
- Supports drag-to-resize or auto-collapse on small screens.
- Maintains full chat state during animation for smooth UX.
*/
