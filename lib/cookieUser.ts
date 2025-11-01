import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyJwt } from "@/lib/jwt";
import { COOKIE_NAME } from "@/lib/cookies";

/**
 * Safely retrieves the currently authenticated user
 * from the HTTP-only JWT cookie.
 *
 * Returns `null` if not authenticated or token invalid.
 */
export async function cookieUser() {
  try {
    const cookieStore = await cookies(); // ✅ await here
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) return null;

    const payload = verifyJwt(token);
    if (!payload?.id) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        schoolId: true,
      },
    });

    return user || null;
  } catch (err) {
    console.error("cookieUser() error:", err);
    return null;
  }
}
