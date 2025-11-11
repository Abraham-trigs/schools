"use client";

import React, { useEffect, useState } from "react";
import { useChatStore } from "./store/ChatStore.ts";
import ChatBox from "./components/ChatBox.tsx";

interface Goal {
  id: string;
  title: string;
  description: string;
}

export default function AstirePage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    activeSessionId,
    sessions,
    setActiveSession,
    fetchSessions,
    createSessionForGoal,
    createGeneralSession,
  } = useChatStore();

  useEffect(() => {
    const fetchGoals = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/app/astire/api/goals");
        if (!res.ok) throw new Error("Failed to fetch goals");
        const data: Goal[] = await res.json();
        setGoals(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchGoals();
  }, []);

  const handleGoalClick = async (goalId: string) => {
    await createSessionForGoal(goalId);
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 p-4 h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="w-full md:w-1/4 bg-gray-100 dark:bg-gray-800 p-4 rounded-lg flex flex-col overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Goals & Sessions
        </h2>

        {loading && <p className="text-gray-500">Loading goals...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {/* Always show General Chat button */}
        <button
          onClick={() => createGeneralSession()}
          className="block w-full text-left p-2 mb-4 rounded bg-green-500 text-white hover:bg-green-600"
        >
          Start General Chat
        </button>

        {goals.map((goal) => (
          <div key={goal.id} className="mb-4">
            <button
              onClick={() => handleGoalClick(goal.id)}
              className="block w-full text-left p-2 rounded transition-colors hover:bg-blue-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold"
            >
              {goal.title}
            </button>

            <div className="mt-2 ml-2 flex flex-col gap-1">
              {sessions
                .filter((s) => s.goalId === goal.id)
                .map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveSession(s.id)}
                    className={`block text-left p-1 px-2 rounded text-sm transition-colors ${
                      activeSessionId === s.id
                        ? "bg-blue-500 text-white"
                        : "hover:bg-blue-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                    }`}
                  >
                    Session {s.id.slice(0, 6)}
                  </button>
                ))}
            </div>
          </div>
        ))}
      </aside>

      {/* Main chat area */}
      <section className="flex-1 flex flex-col">
        {activeSessionId ? (
          <ChatBox />
        ) : (
          <p className="m-auto text-gray-500 dark:text-gray-400 text-center">
            Select a Goal or start a General Chat to begin.
          </p>
        )}
      </section>
    </div>
  );
}
