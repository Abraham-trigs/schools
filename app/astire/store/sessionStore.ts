// /app/astire/store/sessionStore.ts
import { create } from "zustand";

interface SessionStoreState {
  currentGoalId: string | null;
  currentSessionId: string | null;
  setCurrentGoal: (goalId: string) => void;
  setCurrentSession: (sessionId: string) => void;
  reset: () => void;
}

export const useSessionStore = create<SessionStoreState>((set) => ({
  currentGoalId: null,
  currentSessionId: null,
  setCurrentGoal: (goalId: string) => set({ currentGoalId: goalId, currentSessionId: null }),
  setCurrentSession: (sessionId: string) => set({ currentSessionId: sessionId }),
  reset: () => set({ currentGoalId: null, currentSessionId: null }),
}));
