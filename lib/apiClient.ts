// src/lib/api/client.ts
import { notify } from "@/lib/helpers/notifications.ts";

export async function apiClient<T>(
  url: string,
  options: RequestInit & {
    showSuccess?: boolean;
    showError?: boolean;
    successMessage?: string;
    auth?: boolean;
  } = {}
): Promise<T> {
  const { auth = true, showSuccess, showError, successMessage, ...rest } = options;

  try {
    // auto stringify body for JSON requests
    if (rest.body && typeof rest.body !== "string") {
      rest.body = JSON.stringify(rest.body);
    }

    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      credentials: auth ? "include" : undefined,
      ...rest,
    });

    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    if (!res.ok) {
      const errorMessage = data?.error || text || "API request failed";
      if (showError) notify.error(errorMessage);
      throw new Error(errorMessage);
    }

    if (showSuccess && successMessage) {
      notify.success(successMessage);
    }

    return data as T;
  } catch (err: any) {
    if (showError && err.message) notify.error(err.message);
    throw err;
  }
}
