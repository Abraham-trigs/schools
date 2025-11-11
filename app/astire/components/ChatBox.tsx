// /app/components/ChatBox.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { useChatStore, ChatMessage } from "../store/ChatStore.ts";
import { FaUndo, FaRegCopy } from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

interface ChatBoxProps {
  messageRefs?: React.MutableRefObject<Record<string, HTMLDivElement>>;
  highlightedMessageId?: string;
}

export default function ChatBox({
  messageRefs,
  highlightedMessageId,
}: ChatBoxProps) {
  const {
    activeSessionId,
    sessions,
    sendMessage,
    undoAction,
    pendingEvents,
    markEventResolved,
  } = useChatStore();

  const [input, setInput] = useState("");
  const [isAITyping, setIsAITyping] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  // Fallback ref if none provided
  const internalMessageRefs = useRef<Record<string, HTMLDivElement>>({});
  const refs = messageRefs ?? internalMessageRefs;

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const messages = activeSession?.messages || [];

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, pendingEvents, isAITyping]);

  useEffect(() => {
    if (highlightedMessageId && refs.current[highlightedMessageId]) {
      const el = refs.current[highlightedMessageId];
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedId(highlightedMessageId);
      const timeout = setTimeout(() => setHighlightedId(null), 2000);
      return () => clearTimeout(timeout);
    }
  }, [highlightedMessageId, refs]);

  const showToast = (message: string, duration = 2000) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), duration);
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    setIsAITyping(true);
    await sendMessage(input.trim());
    setInput("");
    setIsAITyping(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => showToast("Copied to clipboard!"));
  };

  return (
    <div className="flex flex-col h-full w-full border rounded-lg bg-white dark:bg-gray-800 relative">
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 space-y-2"
        role="log"
        aria-live="polite"
      >
        {messages.map((msg: ChatMessage) => (
          <div
            key={msg.id}
            ref={(el) => {
              if (el) refs.current[msg.id] = el;
            }}
            className={`p-2 rounded-md max-w-[70%] break-words ${
              msg.sender === "USER"
                ? "bg-blue-100 text-blue-900 self-end"
                : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 self-start"
            } ${highlightedId === msg.id ? "highlight-jump" : ""}`}
          >
            <div className="prose dark:prose-invert">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const codeText = String(children).replace(/\n$/, "");
                    return !inline ? (
                      <div className="relative my-2">
                        <pre className="overflow-auto p-2 rounded-md bg-gray-900 text-gray-100">
                          <code className={className} {...props}>
                            {codeText}
                          </code>
                        </pre>
                        <button
                          onClick={() => handleCopy(codeText)}
                          className="absolute top-1 right-1 bg-gray-700 hover:bg-gray-600 text-white text-xs px-2 py-1 rounded-md flex items-center gap-1"
                        >
                          <FaRegCopy /> Copy
                        </button>
                      </div>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {msg.content}
              </ReactMarkdown>
            </div>

            {(msg.type === "ACTION" || msg.type === "QUESTION") && (
              <div className="mt-1 flex space-x-2">
                {msg.type === "ACTION" && (
                  <button
                    onClick={() => undoAction(msg.id)}
                    className="text-sm text-red-600 hover:underline flex items-center gap-1"
                  >
                    <FaUndo /> Undo
                  </button>
                )}
                <button
                  onClick={() => markEventResolved(msg.id)}
                  className="text-sm text-green-600 hover:underline"
                >
                  Mark Resolved
                </button>
              </div>
            )}
          </div>
        ))}

        {isAITyping && (
          <div className="p-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-100 max-w-[50%] animate-pulse">
            AI is typing...
          </div>
        )}

        {pendingEvents.length > 0 && (
          <div className="p-2 text-yellow-700 dark:text-yellow-300 text-sm">
            You have pending actions/questions. Please resolve them before
            sending new messages.
          </div>
        )}
      </div>

      <div className="p-2 border-t border-gray-300 dark:border-gray-600 flex space-x-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
          placeholder={
            pendingEvents.length > 0
              ? "Resolve pending actions/questions first..."
              : "Type a message..."
          }
          disabled={pendingEvents.length > 0 || isAITyping}
          rows={1}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || pendingEvents.length > 0 || isAITyping}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
        >
          Send
        </button>
      </div>

      {toastMessage && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black text-white px-4 py-2 rounded-md shadow-md animate-fade-in-out">
          {toastMessage}
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in-out {
          0% {
            opacity: 0;
            transform: translateX(-50%) translateY(10px);
          }
          10% {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
          90% {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
          100% {
            opacity: 0;
            transform: translateX(-50%) translateY(-10px);
          }
        }
        .animate-fade-in-out {
          animation: fade-in-out 2s ease-in-out forwards;
        }
        .highlight-jump {
          animation: highlight-flash 2s ease-in-out;
        }
        @keyframes highlight-flash {
          0% {
            background-color: #fff3cd;
          }
          50% {
            background-color: transparent;
          }
          100% {
            background-color: transparent;
          }
        }
      `}</style>
    </div>
  );
}
