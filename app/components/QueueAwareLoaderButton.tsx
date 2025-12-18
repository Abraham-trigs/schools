// src/components/QueueAwareLoaderButton.tsx
// Purpose: Loader button that automatically uses AsyncActionQueueProvider for global queue management, skeleton/progress, debounce, and notifications

"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { useAsyncActionQueue } from "@/context/AsyncActionQueueProvider.tsx";

export interface QueueAwareLoaderButtonProps<T = any> {
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
  /** Use skeleton loader instead of spinner */
  useSkeleton?: boolean;
}

/**
 * QueueAwareLoaderButton executes an async action using the global AsyncActionQueueProvider.
 * Automatically:
 * - Tracks action in global queue
 * - Updates global loading state
 * - Shows skeleton or spinner while loading
 * - Debounces clicks
 * - Sends notifications with normalized errors
 */
export default function QueueAwareLoaderButton<T>({
  action,
  onSuccess,
  onError,
  buttonText = "Execute",
  className = "",
  disabled = false,
  debounceTime = 300,
  useSkeleton = false,
}: QueueAwareLoaderButtonProps<T>) {
  const { loading, runAsync } = useAsyncActionQueue();

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
export const ExampleQueueAwareButtonUsage = () => {
  const fakeApi = async () => {
    await new Promise((res) => setTimeout(res, 1500));
    if (Math.random() > 0.5) throw new Error("Random failure");
    return { success: true };
  };

  return (
    <div className="space-y-4">
      <QueueAwareLoaderButton
        action={fakeApi}
        buttonText="Run Queue-Aware Loader"
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
- Fully integrated with AsyncActionQueueProvider for centralized async management.
- Skeleton or spinner improves UX for long-running tasks.
- Debounce prevents accidental rapid repeated triggers.
- normalizeError + notify ensures consistent messaging across the app.

Structure:
- Consumes useAsyncActionQueue to access global loading and runAsync.
- Handles click to trigger action in the queue.
- Conditional rendering for skeleton or spinner.
- Disabled while global loading to prevent overlapping actions.

Implementation guidance:
- Wrap the root layout (_app.tsx) with <AsyncActionQueueProvider>.
- Use QueueAwareLoaderButton for any button that triggers async actions.
- Adjust debounceTime and skeleton mode per component needs.
- Tailwind classes customizable for styling.

Scalability insight:
- Multiple buttons across the app share the same global loading queue.
- ActiveCount from provider can be used for combined progress indicators.
- Extensible for priority queue, weighted actions, or stacked loaders.
- Fully typed generic ensures type-safe API results.
*/
