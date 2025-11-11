// /app/astire/api/Login.ts
// Purpose: Centralized login reference for Abraham

export const Login = {
  // Returns the currently "logged-in" Abraham user (hardcoded)
  getCurrentUser: () => ({
    id: "abraham-001", // must match the `Abraham.id` in your database
    name: "Abraham",
    email: "abrahamtrigs@gmail.com",
    role: "USER" as const, // or "ADMIN", "MODERATOR"
  }),

  // Optional helper to simulate authentication check
  isAuthenticated: () => true,
};
