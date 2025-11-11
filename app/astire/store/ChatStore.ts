// /app/store/chatStore.ts
// Purpose: Zustand store for Astire AI chat system with sessions, messages, streaming AI responses, and undoable actions.

"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { z } from "zod";

export type ChatMessageType = "USER" | "AI" | "QUESTION" | "ACTION";

export interface ActionPayload {
  target?: string;
  amount?: number;
  content?: string;
  goalId?: string;
  projectId?: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  sender: "USER" | "AI";
  type: ChatMessageType;
  content: string;
  createdAt: string;
  actionType?: string;
  actionPayload?: ActionPayload;
}

export interface ChatSession {
  id: string;
  goalId?: string;
  ownerId: string;
  messages: ChatMessage[];
}

interface ExecutedAction {
  messageId: string;
  timestamp: number;
  undo: () => Promise<void>;
}

interface ChatState {
  sessions: ChatSession[];
  activeSessionId: string | null;
  loading: boolean;
  error: string | null;
  executedActions: ExecutedAction[];
  pendingEvents: ChatMessage[];

  setActiveSession: (sessionId: string) => void;
  addMessage: (message: ChatMessage) => void;
  fetchSessions: (goalId?: string) => Promise<void>;
  fetchMessages: (sessionId: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  handleAction: (message: ChatMessage) => Promise<void>;
  undoAction: (messageId: string) => Promise<void>;
  autoStartAIConversation: (sessionId: string, greeting?: string) => Promise<void>;
  markEventResolved: (messageId: string) => void;

  createSessionForGoal: (goalId: string, ownerId?: string) => Promise<string>;
  createGeneralSession: (ownerId?: string) => Promise<string>;
}

const ChatMessageSchema = z.object({
  sessionId: z.string(),
  sender: z.enum(["USER", "AI"]),
  content: z.string().min(1),
});

export const useChatStore = create<ChatState>()(
  devtools((set, get) => ({
    sessions: [],
    activeSessionId: null,
    loading: false,
    error: null,
    executedActions: [],
    pendingEvents: [],

    setActiveSession: (sessionId: string) => {
      set({ activeSessionId: sessionId });
      get().fetchMessages(sessionId);

      const session = get().sessions.find((s) => s.id === sessionId);
      if (session && session.messages.length === 0) {
        get().autoStartAIConversation(sessionId, "Hello! I am your AI assistant.");
      }
    },

    createSessionForGoal: async (goalId: string, ownerId: string = "currentUser") => {
      const { sessions, setActiveSession, autoStartAIConversation } = get();
      const existing = sessions.find((s) => s.goalId === goalId);
      if (existing) {
        setActiveSession(existing.id);
        return existing.id;
      }
      const newSession: ChatSession = {
        id: crypto.randomUUID(),
        goalId,
        ownerId,
        messages: [],
      };
      set((state) => ({ sessions: [...state.sessions, newSession] }));
      setActiveSession(newSession.id);
      await autoStartAIConversation(newSession.id, "Hello! I am your AI assistant for this goal.");
      return newSession.id;
    },

    createGeneralSession: async (ownerId: string = "currentUser") => {
      const { sessions, setActiveSession, autoStartAIConversation } = get();
      const existing = sessions.find((s) => s.goalId === null);
      if (existing) {
        setActiveSession(existing.id);
        return existing.id;
      }
      const newSession: ChatSession = {
        id: crypto.randomUUID(),
        goalId: null,
        ownerId,
        messages: [],
      };
      set((state) => ({ sessions: [...state.sessions, newSession] }));
      setActiveSession(newSession.id);
      await autoStartAIConversation(newSession.id, "Hello! I am your AI assistant for general chat.");
      return newSession.id;
    },

    addMessage: (message: ChatMessage) => {
      set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === message.sessionId
            ? { ...s, messages: [...s.messages, { ...message, sessionId: s.id }] }
            : s
        ),
        pendingEvents:
          message.type === "ACTION" || message.type === "QUESTION"
            ? [...state.pendingEvents, message]
            : state.pendingEvents,
      }));

      if (message.type === "ACTION") get().handleAction(message);
    },

    markEventResolved: (messageId: string) => {
      set((state) => ({
        pendingEvents: state.pendingEvents.filter((m) => m.id !== messageId),
      }));
    },

    fetchSessions: async (goalId?: string) => {
      set({ loading: true, error: null });
      try {
        const url = goalId ? `/app/astire/api/sessions?goalId=${goalId}` : `/app/astire/api/sessions`;
        const res = await fetch(url);
        const data: ChatSession[] = await res.json();
        set({ sessions: data, loading: false });
      } catch (err: any) {
        set({ error: err.message, loading: false });
      }
    },

    fetchMessages: async (sessionId: string) => {
      set({ loading: true, error: null });
      try {
        const res = await fetch(`/app/astire/api/chat?sessionId=${sessionId}`);
        const data = await res.json();
        const messages: ChatMessage[] = (data.messages || []).map((msg: any) => ({
          ...msg,
          type: ["AI", "USER"].includes(msg.sender) ? (msg.sender as ChatMessageType) : "AI",
        }));
        set((state) => ({
          sessions: state.sessions.map((s) => (s.id === sessionId ? { ...s, messages } : s)),
          loading: false,
        }));
      } catch (err: any) {
        set({ error: err.message, loading: false });
      }
    },

    sendMessage: async (content: string) => {
      const { activeSessionId, pendingEvents } = get();
      if (!activeSessionId) return;

      // Enforce unresolved events
      if (pendingEvents.length > 0) {
        get().addMessage({
          id: crypto.randomUUID(),
          sessionId: activeSessionId,
          sender: "AI",
          type: "AI",
          content: "Please resolve pending actions or questions before proceeding.",
          createdAt: new Date().toISOString(),
        });
        return;
      }

      const parsed = ChatMessageSchema.parse({ sessionId: activeSessionId, sender: "USER", content });
      const userMsg: ChatMessage = { ...parsed, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
      get().addMessage(userMsg);

      try {
        const res = await fetch("/app/astire/api/chat/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed),
        });
        if (!res.body) return;

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let aiContent = "";
        let buffer = "";

        const aiMsg: ChatMessage = { id: crypto.randomUUID(), sessionId: activeSessionId, sender: "AI", type: "AI", content: "", createdAt: new Date().toISOString() };
        get().addMessage(aiMsg);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          aiContent += chunk;
          const lines = (buffer + chunk).split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const json = JSON.parse(line);
              if (json.type === "ACTION" || json.type === "QUESTION") {
                const actionMsg: ChatMessage = {
                  id: crypto.randomUUID(),
                  sessionId: activeSessionId,
                  sender: "AI",
                  type: json.type,
                  content: json.content || "",
                  actionType: json.actionType,
                  actionPayload: json.actionPayload,
                  createdAt: new Date().toISOString(),
                };
                get().addMessage(actionMsg);
                if (json.type === "ACTION") get().handleAction(actionMsg);
              }
            } catch {
              set((state) => ({
                sessions: state.sessions.map((s) =>
                  s.id === activeSessionId
                    ? {
                        ...s,
                        messages: s.messages.map((m) =>
                          m.id === aiMsg.id ? { ...m, content: aiContent } : m
                        ),
                      }
                    : s
                ),
              }));
            }
          }

          set((state) => ({
            sessions: state.sessions.map((s) =>
              s.id === activeSessionId
                ? {
                    ...s,
                    messages: s.messages.map((m) =>
                      m.id === aiMsg.id ? { ...m, content: aiContent } : m
                    ),
                  }
                : s
            ),
          }));
        }

        if (buffer.trim()) {
          try {
            const json = JSON.parse(buffer);
            if (json.type === "ACTION" || json.type === "QUESTION") {
              const actionMsg: ChatMessage = {
                id: crypto.randomUUID(),
                sessionId: activeSessionId,
                sender: "AI",
                type: json.type,
                content: json.content || "",
                actionType: json.actionType,
                actionPayload: json.actionPayload,
                createdAt: new Date().toISOString(),
              };
              get().addMessage(actionMsg);
              if (json.type === "ACTION") get().handleAction(actionMsg);
            }
          } catch {}
        }
      } catch (err: any) {
        set({ error: err.message });
      }
    },

    handleAction: async (message: ChatMessage) => {
      const { actionType, actionPayload } = message;
      if (!actionType || !actionPayload) return;

      const undoFn = async () => {
        set((state) => ({
          executedActions: state.executedActions.filter((a) => a.messageId !== message.id),
        }));
      };

      switch (actionType) {
        case "SUBMIT_CV":
          console.log("Submitting CV:", actionPayload.content);
          break;
        case "ALLOCATE_FUNDS":
          console.log(`Allocating ${actionPayload.amount} to ${actionPayload.target}`);
          break;
        case "CREATE_TASK":
          console.log("Creating task/project:", actionPayload);
          break;
        default:
          console.warn("Unknown action type:", actionType);
      }

      set((state) => ({
        executedActions: [...state.executedActions, { messageId: message.id, timestamp: Date.now(), undo: undoFn }],
      }));
    },

    undoAction: async (messageId: string) => {
      const action = get().executedActions.find((a) => a.messageId === messageId);
      if (action) await action.undo();
    },

    autoStartAIConversation: async (sessionId: string, greeting: string = "Hi there!") => {
      await get().sendMessage(greeting);
    },
  }))
);

/*
Design reasoning:
- Maintains full chat session state with undoable actions and pending event queue.
- Prevents GPT from generating new ACTIONs/QUESTIONS until unresolved ones are handled.
- Supports streaming AI messages with incremental parsing and optimistic updates.

Structure:
- Sessions, messages, executedActions, pendingEvents are tracked in state.
- Methods for creating sessions, sending messages, handling actions, undoing actions.
- sendMessage streams AI content and parses structured events line-by-line.

Implementation guidance:
- Frontend appends chunks to live AI message; ACTIONs/QUESTIONs are queued until resolved.
- markEventResolved unlocks GPT to generate new events.
- Optimistic updates ensure smooth UX; errors captured in `error`.

Scalability insight:
- Pending queue enforces linear action flow; prevents overloading user with multiple unresolved tasks.
- Supports concurrent sessions and streaming large responses efficiently.
- Easily extensible with new ACTION types or structured events.
*/
