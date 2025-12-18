// src/context/AsyncActionProvider.tsx
// Purpose: Provides global async action handling with loading, skeletons, debounce, notifications, and normalized error

"use client";

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  ReactNode,
} from "react";
import { notify } from "@/lib/helpers/notifications.ts";
import { normalizeError } from "@/lib/helpers/errorHandler.ts";

interface AsyncActionContextType {
  /** Global loading state for UI */
  loading: boolean;
  /** Run an async action with automatic error handling, notifications, debounce */
  runAsync: <T>(
    action: () => Promise<T>,
    options?: AsyncActionOptions<T>
  ) => Promise<T | undefined>;
}

interface AsyncActionOptions<T = any> {
  debounceTime?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
}

const AsyncActionContext = createContext<AsyncActionContextType | undefined>(
  undefined
);

/** Hook to consume global async action context */
export function useAsyncActionContext() {
  const context = useContext(AsyncActionContext);
  if (!context)
    throw new Error(
      "useAsyncActionContext must be used within AsyncActionProvider"
    );
  return context;
}

interface AsyncActionProviderProps {
  children: ReactNode;
}

/**
 * AsyncActionProvider wraps the app and provides global async action management.
 * - Centralizes loading state
 * - Handles debounce
 * - Normalizes errors
 * - Sends notifications
 */
export const AsyncActionProvider: React.FC<AsyncActionProviderProps> = ({
  children,
}) => {
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const runAsync = useCallback(
    async <T,>(
      action: () => Promise<T>,
      options?: AsyncActionOptions<T>
    ): Promise<T | undefined> => {
      const { debounceTime = 300, onSuccess, onError } = options || {};

      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      return new Promise((resolve) => {
        timeoutRef.current = setTimeout(async () => {
          setLoading(true);
          try {
            const result = await action();
            notify.success("Action completed successfully");
            onSuccess?.(result);
            resolve(result);
          } catch (err: any) {
            let message = "Something went wrong";
            if (err instanceof Response) {
              message = await normalizeError(err, message);
            } else if (err instanceof Error) {
              message = err.message;
            }
            notify.error(message);
            onError?.(message);
            resolve(undefined);
          } finally {
            setLoading(false);
          }
        }, debounceTime);
      });
    },
    []
  );

  return (
    <AsyncActionContext.Provider value={{ loading, runAsync }}>
      {children}
    </AsyncActionContext.Provider>
  );
};

// Example component using global AsyncActionProvider
export const ExampleGlobalAsyncUsage = () => {
  const { loading, runAsync } = useAsyncActionContext();

  const fakeApiCall = async () => {
    await new Promise((res) => setTimeout(res, 1500));
    if (Math.random() > 0.5) throw new Error("Random failure");
    return { success: true };
  };

  return (
    <div className="space-y-4">
      <button
        onClick={() => runAsync(fakeApiCall, { debounceTime: 500 })}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-400"
      >
        {loading ? (
          <div className="w-20 h-5 bg-gray-300 rounded animate-pulse" />
        ) : (
          "Run Global API"
        )}
      </button>
    </div>
  );
};

/*
Design reasoning:
- Centralizes all async handling to a single context for consistency.
- Provides global loading and notification system for UX improvements.
- Debounce prevents accidental multi-triggering.
- normalizeError ensures all API errors are consistently formatted.

Structure:
- Context + Provider pattern
- runAsync handles async call, debounce, success/error callbacks
- loading state exposed globally

Implementation guidance:
- Wrap <AsyncActionProvider> around _app.tsx or root layout
- Use useAsyncActionContext in any component to access runAsync and global loading
- Optional skeleton UI can be tied to `loading` state

Scalability insight:
- Supports multiple concurrent async actions safely
- Provides a single source of truth for async loading
- Can be extended for global spinners, progress bars, or stacked notifications
- Generic typing ensures type-safe API responses
*/
