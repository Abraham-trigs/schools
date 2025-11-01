export async function normalizeError(
  res: Response,
  fallback?: string
): Promise<string> {
  try {
    const text = await res.text();
    const data = JSON.parse(text || "{}");
    return data?.error || data?.message || fallback || `Error ${res.status}`;
  } catch {
    return fallback || `Request failed (${res.status})`;
  }
}
