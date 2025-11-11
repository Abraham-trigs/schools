// /app/astire/components/SessionSelector.tsx
"use client";

// Purpose: Select a chat session under the current goal with accessibility and auto-fetching.

import React, { useEffect, useRef, useState } from "react";
import { useSessionStore } from "../store/sessionStore.ts";
import { useChatStore, ChatSession } from "../store/ChatStore.ts";

export default function SessionSelector() {
  const { currentGoalId, currentSessionId, setCurrentSession } =
    useSessionStore();
  const {
    sessions,
    fetchSessions,
    setActiveSession,
    loading: chatLoading,
  } = useChatStore();

  const [loading, setLoading] = useState(false);
  const sessionListRef = useRef<HTMLDivElement>(null);

  // Filter sessions for the current goal
  const goalSessions: ChatSession[] = sessions.filter(
    (s) => s.goalId === currentGoalId
  );

  // Fetch sessions when goal changes
  useEffect(() => {
    if (!currentGoalId) return;
    setLoading(true);
    fetchSessions(currentGoalId)
      .catch((err) => console.error("Error fetching sessions:", err))
      .finally(() => setLoading(false));
  }, [currentGoalId, fetchSessions]);

  // Scroll to active session
  useEffect(() => {
    const activeEl = sessionListRef.current?.querySelector(
      `[data-session-id="${currentSessionId}"]`
    );
    activeEl?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [currentSessionId]);

  if (!currentGoalId)
    return (
      <p className="text-gray-400 dark:text-gray-500">Select a goal first.</p>
    );
  if (loading || chatLoading)
    return (
      <p className="text-gray-500 dark:text-gray-400">Loading sessions...</p>
    );
  if (!goalSessions.length)
    return <p className="text-gray-400 dark:text-gray-500">No sessions yet.</p>;

  return (
    <div
      ref={sessionListRef}
      className="flex flex-col gap-2 max-h-80 overflow-y-auto"
      role="listbox"
      aria-label="Session Selector"
    >
      {goalSessions.map((session) => {
        const isActive = currentSessionId === session.id;
        return (
          <button
            key={session.id}
            data-session-id={session.id}
            role="option"
            aria-selected={isActive}
            onClick={() => {
              setCurrentSession(session.id);
              setActiveSession(session.id);
            }}
            className={`p-2 rounded text-left focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors ${
              isActive
                ? "bg-blue-500 text-white"
                : "bg-gray-200 dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-blue-600 text-white"
            }`}
          >
            {`Session: ${new Date(session.createdAt).toLocaleString()}`}
          </button>
        );
      })}
    </div>
  );
}

/*
Design reasoning:
- Provides a clean, scrollable list of sessions filtered by goal.
- Accessibility: ARIA roles and selected states, focus management.
- Automatically scrolls to the active session for better UX.

Structure:
- Uses `useEffect` to fetch sessions and scroll to the active session.
- Buttons represent individual sessions, highlighting the active one.

Implementation guidance:
- Wrap session fetch in try/catch to handle network errors gracefully.
- Link each button to `setCurrentSession` and `setActiveSession` for store sync.

Scalability insight:
- Supports multi-goal multi-session workflows.
- Easily extendable with search/filter and pagination for large session lists.
- Could add optimistically created sessions or real-time updates in the future.
*/
