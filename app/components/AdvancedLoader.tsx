// src/components/AdvancedLoader.tsx
// Purpose: Async loader with automatic API response handling, debounce, skeleton UI, and notifications

"use client";

import React, { useState, useCallback, useRef } from "react";
import { notify } from "@/lib/helpers/notifications.ts";
import { normalizeError } from "@/lib/helpers/errorHandler.ts";
import { Loader2 } from "lucide-react";

export interface AdvancedLoaderProps<T = any> {
  /** Async action to perform (API call or any promise-returning function) */
  action: () => Promise<T>;
  /** Optional children to show inside the button or trigger element */
  children?: React.ReactNode;
  /** Success callback */
  onSuccess?: (data: T) => void;
  /** Error callback */
  onError?: (error: string) => void;
  /** Button label */
  buttonText?: string;
  /** Tailwind or custom CSS classes */
  className?: string;
  /** Disable button */
  disabled?: boolean;
  /** Debounce time in ms */
  debounceTime?: number;
  /** Show skeleton loader instead of spinner */
  useSkeleton?: boolean;
}

/**
 * AdvancedLoader provides async handling with:
 * - Loading state (spinner or skeleton)
 * - Debounced execution
 * - Error normalization via normalizeError
 * - Notifications via sonner
 */
export default function AdvancedLoader<T>({
  action,
  children,
  onSuccess,
  onError,
  buttonText = "Execute",
  className = "",
  disabled = false,
  debounceTime = 300,
  useSkeleton = false,
}: AdvancedLoaderProps<T>) {
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleClick = useCallback(() => {
    if (disabled || loading) return;

    // Debounce execution
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
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
      }
    }, debounceTime);
  }, [action, onSuccess, onError, loading, disabled, debounceTime]);

  return (
    <button
      onClick={handleClick}
      disabled={loading || disabled}
      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 ${className}`}
    >
      {loading &&
        (useSkeleton ? (
          <div className="w-20 h-5 bg-gray-300 rounded animate-pulse" />
        ) : (
          <Loader2 className="animate-spin h-5 w-5" />
        ))}
      {!loading && (children || buttonText)}
    </button>
  );
}

// Example usage (production-ready)
export const ExampleAdvancedUsage = () => {
  const fakeApi = async () => {
    await new Promise((res) => setTimeout(res, 1500));
    if (Math.random() > 0.5) throw new Error("Random failure");
    return { success: true };
  };

  return (
    <div className="space-y-4">
      <AdvancedLoader
        action={fakeApi}
        buttonText="Run Debounced API"
        debounceTime={500}
        useSkeleton
        onSuccess={(data) => console.log("Success:", data)}
        onError={(err) => console.log("Error:", err)}
      />
    </div>
  );
};

/*
Design reasoning:
- Debounced clicks prevent accidental multi-calls.
- Skeleton loader improves perceived UX for long-running actions.
- Notifications standardize feedback and integrate existing helpers.
- normalizeError ensures consistent error messaging.

Structure:
- useState tracks loading state.
- useRef + setTimeout implements debounce.
- Conditional rendering for spinner or skeleton.
- Fully generic type-safe async action.

Implementation guidance:
- Use `action` for any API fetch or promise-returning logic.
- Optional onSuccess/onError for custom handling.
- Adjust debounceTime for UX-sensitive operations.
- Skeleton loader can match expected content size for smoother UI.

Scalability insight:
- Fully reusable for multiple concurrent buttons.
- Skeleton and spinner interchangeable per component instance.
- Can wrap multiple async actions with consistent error handling and notifications.
- Generic type support allows strong typing for returned data.
*/
