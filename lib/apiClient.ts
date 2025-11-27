// src/lib/api/client.ts
import { notify } from "@/lib/helpers/notifications.ts";

export async function apiClient<T>(
  url: string,
  options: RequestInit & {
    headers?: Record<string, string>; // <-- allow custom headers
    showSuccess?: boolean;
    showError?: boolean;
    successMessage?: string;
    auth?: boolean;
  } = {}
): Promise<T> {
  const { auth = true, showSuccess, showError, successMessage, headers = {}, ...rest } = options;

  try {
    if (rest.body && typeof rest.body !== "string") {
      rest.body = JSON.stringify(rest.body);
    }

    const res = await fetch(url, {
      headers: { "Content-Type": "application/json", ...headers }, // merge custom headers
      credentials: auth ? "include" : undefined,
      ...rest,
    });

    const text = await res.text();
    let data: any = null;

    // Try parsing JSON but fallback gracefully
    try {
      data = text ? JSON.parse(text) : null;
    } catch (parseErr) {
      throw new Error(`Server returned invalid JSON: ${text.slice(0, 200)}`);
    }

    if (!res.ok) {
      const errorMessage = data?.error || text || `API request failed: ${res.status}`;
      if (showError) notify.error(errorMessage);
      throw new Error(errorMessage);
    }

    if (showSuccess && successMessage) notify.success(successMessage);

    return data as T;
  } catch (err: any) {
    if (showError && err.message) notify.error(err.message);
    throw err;
  }
}
