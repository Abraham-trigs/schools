// src/components/CustomLoader.tsx
// Purpose: Full-featured loader component with async handling, error normalization, and notifications

"use client";

import React, { useState, useCallback } from "react";
import { notify } from "@/lib/helpers/notifications.ts";
import { normalizeError } from "@/lib/helpers/errorHandler.ts"; // assumes this exists
import { Loader2 } from "lucide-react";

export interface LoaderProps<T = any> {
  action: () => Promise<T>;
  children?: React.ReactNode;
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
  buttonText?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * CustomLoader executes an async action and handles loading, success, and error states.
 * Shows a spinner during execution and integrates normalizeError + notify helpers.
 */
export default function CustomLoader<T>({
  action,
  children,
  onSuccess,
  onError,
  buttonText = "Execute",
  className = "",
  disabled = false,
}: LoaderProps<T>) {
  const [loading, setLoading] = useState(false);

  const handleClick = useCallback(async () => {
    if (disabled || loading) return;
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
  }, [action, onSuccess, onError, loading, disabled]);

  return (
    <button
      onClick={handleClick}
      disabled={loading || disabled}
      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 ${className}`}
    >
      {loading && <Loader2 className="animate-spin h-5 w-5" />}
      {children || buttonText}
    </button>
  );
}

// Example usage (can be removed in production)
export const ExampleUsage = () => {
  const fakeApiCall = async () => {
    await new Promise((res) => setTimeout(res, 2000));
    if (Math.random() > 0.5) throw new Error("Random failure");
    return "Success Data";
  };

  return (
    <div className="space-y-4">
      <CustomLoader
        action={fakeApiCall}
        onSuccess={(data) => console.log("Data:", data)}
        onError={(err) => console.log("Error:", err)}
      >
        Run Fake API
      </CustomLoader>
    </div>
  );
};

/*
Design reasoning:
- Combines async handling, spinner UX, error normalization, and notification into one reusable component.
- Uses existing normalizeError and notify helpers to standardize UX and messaging.

Structure:
- LoaderProps interface supports generics for type-safe async action results.
- useState handles loading state.
- useCallback ensures proper memoization of handler.
- Button disabled state and spinner integrated for UX clarity.

Implementation guidance:
- Wrap any async call (fetch, Prisma API call, mutation) in the `action` prop.
- Provide onSuccess/onError for custom reactions to API results.
- Accessible, keyboard-navigable button.

Scalability insight:
- Fully generic; can wrap any async function.
- Can be styled with Tailwind or replaced with different loader icons without changing core logic.
- Supports multiple concurrent instances safely via isolated state.
*/
