// src/components/HookedAdvancedLoader.tsx
// Purpose: Loader button fully powered by useAsyncAction hook with debounce, skeleton, notifications, and normalized error handling

"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { useAsyncAction } from "@/hooks/useAsyncAction.tsx";

export interface HookedAdvancedLoaderProps<T = any> {
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
 * HookedAdvancedLoader is a reusable button component that executes any async action
 * using useAsyncAction hook. It provides:
 * - Loading state (spinner or skeleton)
 * - Debounced execution
 * - Notifications via sonner
 * - normalizeError integration
 */
export default function HookedAdvancedLoader<T>({
  action,
  onSuccess,
  onError,
  buttonText = "Execute",
  className = "",
  disabled = false,
  debounceTime = 300,
  useSkeleton = false,
}: HookedAdvancedLoaderProps<T>) {
  const { loading, run } = useAsyncAction(action, {
    debounceTime,
    onSuccess,
    onError,
  });

  return (
    <button
      onClick={run}
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
export const ExampleHookedLoaderUsage = () => {
  const fakeApiCall = async () => {
    await new Promise((res) => setTimeout(res, 1500));
    if (Math.random() > 0.5) throw new Error("Random failure");
    return { success: true };
  };

  return (
    <div className="space-y-4">
      <HookedAdvancedLoader
        action={fakeApiCall}
        buttonText="Run Hooked Loader"
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
- Fully hook-driven to centralize async, debounce, loading, and error handling logic.
- Skeleton loader improves UX perception for long-running actions.
- Notifications standardize user feedback.
- normalizeError ensures consistent error messaging.

Structure:
- Wraps useAsyncAction hook to manage loading state and execution.
- Conditional rendering for spinner or skeleton.
- Button disabled during loading for accessibility and UX.

Implementation guidance:
- Use `action` prop for any async API call or promise.
- Provide optional onSuccess/onError for custom post-processing.
- useSkeleton can match UI layout for smoother transitions.
- debounceTime ensures accidental multi-clicks are prevented.

Scalability insight:
- Fully reusable across the app for any async action.
- Generic typing allows type-safe API results.
- Multiple instances can coexist independently without interfering.
- Skeleton and spinner styles can be customized per component instance.
*/
