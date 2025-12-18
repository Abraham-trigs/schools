// src/context/AsyncActionQueueProvider.tsx
// Purpose: Global async action queue with combined loading state, skeleton/progress UI, debounce, notifications, and normalized error

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

interface AsyncActionQueueContextType {
  /** Number of active async actions */
  activeCount: number;
  /** Global loading state: true if any action is running */
  loading: boolean;
  /** Run an async action with queue management, debounce, notifications, and error normalization */
  runAsync: <T>(
    action: () => Promise<T>,
    options?: AsyncActionQueueOptions<T>
  ) => Promise<T | undefined>;
}

interface AsyncActionQueueOptions<T = any> {
  debounceTime?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
}

const AsyncActionQueueContext = createContext<
  AsyncActionQueueContextType | undefined
>(undefined);

/** Hook to consume global async action queue context */
export function useAsyncActionQueue() {
  const context = useContext(AsyncActionQueueContext);
  if (!context)
    throw new Error(
      "useAsyncActionQueue must be used within AsyncActionQueueProvider"
    );
  return context;
}

interface AsyncActionQueueProviderProps {
  children: ReactNode;
}

/**
 * AsyncActionQueueProvider manages multiple async actions globally.
 * - Tracks active async actions count
 * - Provides global loading state
 * - Debounce, notifications, and normalizeError applied
 * - Can render combined skeleton/progress UI
 */
export const AsyncActionQueueProvider: React.FC<
  AsyncActionQueueProviderProps
> = ({ children }) => {
  const [activeCount, setActiveCount] = useState(0);
  const timeoutRefs = useRef<Map<() => void, NodeJS.Timeout>>(new Map());

  const loading = activeCount > 0;

  const runAsync = useCallback(
    async <T,>(
      action: () => Promise<T>,
      options?: AsyncActionQueueOptions<T>
    ): Promise<T | undefined> => {
      const { debounceTime = 300, onSuccess, onError } = options || {};

      // Debounce logic
      if (timeoutRefs.current.has(action))
        clearTimeout(timeoutRefs.current.get(action));
      return new Promise((resolve) => {
        const timeout = setTimeout(async () => {
          setActiveCount((prev) => prev + 1);
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
            setActiveCount((prev) => Math.max(prev - 1, 0));
            timeoutRefs.current.delete(action);
          }
        }, debounceTime);

        timeoutRefs.current.set(action, timeout);
      });
    },
    []
  );

  return (
    <AsyncActionQueueContext.Provider
      value={{ activeCount, loading, runAsync }}
    >
      {children}
    </AsyncActionQueueContext.Provider>
  );
};

// Optional: Combined Skeleton/Progress Component
export const GlobalActionProgress = () => {
  const { activeCount } = useAsyncActionQueue();
  if (activeCount === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 w-80 h-2 bg-gray-300 rounded overflow-hidden z-50">
      <div
        className="h-2 bg-blue-600 animate-pulse"
        style={{ width: `${Math.min(activeCount * 20, 100)}%` }}
      />
    </div>
  );
};

// Example usage
export const ExampleQueueUsage = () => {
  const { runAsync } = useAsyncActionQueue();

  const fakeApiCall = async () => {
    await new Promise((res) => setTimeout(res, 1500));
    if (Math.random() > 0.5) throw new Error("Random failure");
    return { success: true };
  };

  return (
    <div className="space-y-4">
      <button
        onClick={() => runAsync(fakeApiCall, { debounceTime: 500 })}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Trigger API Call
      </button>
      <button
        onClick={() => runAsync(fakeApiCall, { debounceTime: 200 })}
        className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
      >
        Trigger Fast API Call
      </button>
      <GlobalActionProgress />
    </div>
  );
};

/*
Design reasoning:
- Tracks all active async actions globally to improve UX and prevent multiple overlapping actions from being invisible.
- Provides a central loading indicator (skeleton or progress bar).
- Debounce prevents accidental repeated triggers.
- normalizeError + notify ensures consistent messaging.

Structure:
- activeCount state tracks running actions.
- runAsync executes promises with debounce and increments/decrements activeCount.
- GlobalActionProgress visualizes combined loading state.

Implementation guidance:
- Wrap <AsyncActionQueueProvider> around _app.tsx or root layout.
- Use runAsync for any async call anywhere in the app.
- GlobalActionProgress optional, can be placed in layout for consistent feedback.

Scalability insight:
- Supports multiple concurrent actions with dynamic UI feedback.
- Debounce ensures stability for repeated triggers.
- Can extend progress calculation logic for weighted actions or priority queues.
- Generic typing allows type-safe results across the app.
*/
