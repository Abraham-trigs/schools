// lib/cookieUser.ts
// Purpose: Safely retrieve authenticated user from HTTP-only JWT cookie using Prisma Role enum

import { cookies } from "next/headers";
import { prisma, Role } from "@/lib/db"; // Role imported from Prisma schema
import { verifyJwt } from "@/lib/jwt";
import { COOKIE_NAME } from "@/lib/cookies";

/**
 * Returns minimal authenticated user info if JWT token is valid.
 * Adds `schoolDomain` as a top-level property for easier client access.
 * Otherwise returns null.
 */
export async function cookieUser() {
  try {
    const cookieStore = await cookies();
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
        role: true as Role,
        school: { select: { id: true, name: true, domain: true } },
      },
    });

    if (!user) return null;

    return {
      ...user,
      schoolId: user.school.id,
      schoolDomain: user.school.domain, // top-level convenience
    };
  } catch (err) {
    console.error("cookieUser() error:", err);
    return null;
  }
}

/* Example usage:
const user = await cookieUser();
if (user) {
  console.log(user.role, user.schoolDomain); // now accessible at top-level
}
*/
