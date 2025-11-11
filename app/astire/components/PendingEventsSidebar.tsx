// /app/components/PendingEventsSidebar.tsx
// Purpose: Sidebar for listing pending actions/questions with jump-to-message and resolve functionality.

"use client";

import React, { useState } from "react";
import { useChatStore, ChatMessage } from "@/store/chatStore";

interface PendingEventsSidebarProps {
  messageRefs: React.MutableRefObject<Record<string, HTMLDivElement>>;
  onHighlight: (messageId: string) => void;
}

export default function PendingEventsSidebar({
  messageRefs,
  onHighlight,
}: PendingEventsSidebarProps) {
  const { pendingEvents, markEventResolved } = useChatStore();
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleJump = (msg: ChatMessage) => {
    const el = messageRefs.current[msg.id];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      onHighlight(msg.id);
      setActiveId(msg.id);
      setTimeout(() => setActiveId(null), 2000); // sync with highlight animation
    }
  };

  if (pendingEvents.length === 0) return null;

  return (
    <div className="w-64 border-l border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 p-2 flex flex-col">
      <h3 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">
        Pending Events
      </h3>
      <div className="flex-1 overflow-y-auto space-y-1">
        {pendingEvents.map((msg) => (
          <div
            key={msg.id}
            onClick={() => handleJump(msg)}
            className={`p-2 rounded-md cursor-pointer ${
              activeId === msg.id
                ? "bg-yellow-200 dark:bg-yellow-600"
                : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {msg.type}:{" "}
              {msg.content.length > 40
                ? msg.content.slice(0, 40) + "..."
                : msg.content}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                markEventResolved(msg.id);
              }}
              className="mt-1 text-xs text-green-700 dark:text-green-300 hover:underline"
            >
              Mark Resolved
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/*
Design reasoning:
- Sidebar lists pending actions/questions to give the user clear visibility.
- Clicking a pending event scrolls to that message in ChatBox and triggers highlight.
- Inline "Mark Resolved" ensures quick resolution without jumping.

Structure:
- Accepts `messageRefs` to locate messages in ChatBox.
- Uses `onHighlight` callback to set `highlightedMessageId` in ChatBox.
- Tracks temporary activeId for local highlight state in sidebar.

Implementation guidance:
- Place sidebar next to ChatBox in a flex layout (e.g., <div className="flex"><ChatBox /> <PendingEventsSidebar /></div>).
- Automatically scrolls and highlights, syncing with ChatBox animations.
- Stops event propagation on "Mark Resolved" button to avoid triggering jump.

Scalability insight:
- Can support filtering, grouping by type, or prioritization.
- Works seamlessly with multiple sessions and streaming AI messages.
- Can later extend for global notification panel integration.
*/
