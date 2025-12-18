// src/hooks/useAsyncAction.tsx
// Purpose: Hook to wrap any async function with loading, debounce, error handling, notifications, and optional callbacks

"use client";

import { useState, useRef, useCallback } from "react";
import { notify } from "@/lib/helpers/notifications.ts";
import { normalizeError } from "@/lib/helpers/errorHandler.ts";

export interface UseAsyncActionOptions<T = any> {
  /** Debounce time in milliseconds */
  debounceTime?: number;
  /** Callback on success */
  onSuccess?: (data: T) => void;
  /** Callback on error */
  onError?: (error: string) => void;
  /** Optional initial loading state */
  initialLoading?: boolean;
}

/** Hook return type */
export interface UseAsyncActionReturn<T> {
  /** Loading state */
  loading: boolean;
  /** Executes the async function */
  run: () => Promise<void>;
}

/**
 * useAsyncAction provides a reusable way to wrap any async function with:
 * - Loading state
 * - Debounce
 * - Error normalization
 * - Notifications
 */
export function useAsyncAction<T>(
  action: () => Promise<T>,
  options: UseAsyncActionOptions<T> = {}
): UseAsyncActionReturn<T> {
  const {
    debounceTime = 300,
    onSuccess,
    onError,
    initialLoading = false,
  } = options;
  const [loading, setLoading] = useState(initialLoading);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const run = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    return new Promise<void>((resolve) => {
      timeoutRef.current = setTimeout(async () => {
        setLoading(true);
        try {
          const result = await action();
          notify.success("Action completed successfully");
          onSuccess?.(result);
        } catch (err: any) {
          let message = "Something went wrong";
          if (err instanceof Response) {
            message = await normalizeError(err, message);
          } else if (err instanceof Error) {
            message = err.message;
          }
          notify.error(message);
          onError?.(message);
        } finally {
          setLoading(false);
          resolve();
        }
      }, debounceTime);
    });
  }, [action, debounceTime, onSuccess, onError]);

  return { loading, run };
}

// Example usage (production-ready)
export const ExampleHookUsage = () => {
  const fakeApiCall = async () => {
    await new Promise((res) => setTimeout(res, 2000));
    if (Math.random() > 0.5) throw new Error("Random failure");
    return { success: true };
  };

  const { loading, run } = useAsyncAction(fakeApiCall, {
    debounceTime: 500,
    onSuccess: (data) => console.log("Data:", data),
    onError: (err) => console.log("Error:", err),
  });

  return (
    <div className="space-y-4">
      <button
        onClick={run}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400"
      >
        {loading ? (
          <div className="w-20 h-5 bg-gray-300 animate-pulse rounded" />
        ) : (
          "Run Hook API"
        )}
      </button>
    </div>
  );
};

/*
Design reasoning:
- Centralizes async handling for any API call.
- Provides skeleton UX, debounce, and notifications consistently.
- Keeps components clean and reduces duplicated logic.

Structure:
- useState for loading
- useRef + setTimeout for debounce
- run function handles try/catch, normalizeError, notify

Implementation guidance:
- Wrap fetch or mutation calls in `action`.
- Optional callbacks for fine-grained success/error handling.
- Can be reused across components for consistent UX.

Scalability insight:
- Fully generic type T ensures type safety.
- Multiple instances of the hook can coexist independently.
- Debounce prevents accidental multiple API calls.
- Skeleton loading can be styled per component needs.
*/
