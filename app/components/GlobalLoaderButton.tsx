// src/components/GlobalLoaderButton.tsx
// Purpose: Loader button that automatically uses AsyncActionProvider for global async handling, skeleton, debounce, and notifications

"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { useAsyncActionContext } from "@/context/AsyncActionProvider.tsx";

export interface GlobalLoaderButtonProps<T = any> {
  /** Async action (API call or promise) */
  action: () => Promise<T>;
  /** Optional success callback */
  onSuccess?: (data: T) => void;
  /** Optional error callback */
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
 * GlobalLoaderButton executes an async action using the global AsyncActionProvider.
 * Automatically handles:
 * - Global loading state
 * - Skeleton UI or spinner
 * - Debounce
 * - Notifications and normalized error
 */
export default function GlobalLoaderButton<T>({
  action,
  onSuccess,
  onError,
  buttonText = "Execute",
  className = "",
  disabled = false,
  debounceTime = 300,
  useSkeleton = false,
}: GlobalLoaderButtonProps<T>) {
  const { loading, runAsync } = useAsyncActionContext();

  const handleClick = () =>
    runAsync(action, { debounceTime, onSuccess, onError });

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
      {!loading && buttonText}
    </button>
  );
}

// Example usage
export const ExampleGlobalButtonUsage = () => {
  const fakeApi = async () => {
    await new Promise((res) => setTimeout(res, 1500));
    if (Math.random() > 0.5) throw new Error("Random failure");
    return { success: true };
  };

  return (
    <div className="space-y-4">
      <GlobalLoaderButton
        action={fakeApi}
        buttonText="Run Global Loader"
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
- Fully leverages AsyncActionProvider for consistent global loading and notifications.
- Skeleton or spinner improves UX for long-running operations.
- Debounce ensures accidental rapid clicks do not trigger multiple calls.
- normalizeError and notify standardize error handling and user feedback.

Structure:
- Uses useAsyncActionContext to access runAsync and global loading state.
- Button renders spinner or skeleton automatically when global loading is active.
- Optional props for success/error callbacks, debounce, skeleton mode, and styling.

Implementation guidance:
- Wrap app with <AsyncActionProvider> in root layout (_app.tsx).
- Pass any async API call or promise as `action`.
- Customize debounceTime and skeleton mode per use case.
- Optional Tailwind classes can adjust button appearance.

Scalability insight:
- Multiple buttons can use the same global loading state for consistent UX.
- Skeletons can be styled individually to match layout needs.
- Centralized async management reduces duplicated logic and ensures consistent notifications and error normalization.
- Generic typing ensures type-safe API responses across app.
*/
