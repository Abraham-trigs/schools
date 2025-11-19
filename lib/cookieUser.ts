// lib/cookieUser.ts
// Purpose: Safely retrieve authenticated user from HTTP-only JWT cookie using Prisma Role enum,
//          including optional student/staff application data, fully scoped to the user's school,
//          with caching for efficiency.

import { cookies } from "next/headers";
import { prisma, Role } from "@/lib/db";
import { verifyJwt } from "@/lib/jwt";
import { COOKIE_NAME } from "@/lib/cookies";

/** TypeScript interface for returned user shape */
export interface CookieUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  schoolDomain: string;
  Application?: any; // optional, detailed Student Application
  staffApplication?: any;   // optional, detailed Staff Application
}

/** In-memory cache to store recent user fetches for a short TTL */
const userCache = new Map<string, { user: CookieUser; timestamp: number }>();
const CACHE_TTL = 5000; // milliseconds, adjust as needed

/**
 * Retrieves authenticated user info from JWT cookie, scoped to their school.
 * Returns null if token invalid or user not found.
 */
export async function cookieUser(): Promise<CookieUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = verifyJwt(token);
    if (!payload?.id) return null;

    // Check cache first
    const cached = userCache.get(payload.id);
    const now = Date.now();
    if (cached && now - cached.timestamp < CACHE_TTL) {
      return cached.user;
    }

    // Fetch basic user info along with their school
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

    let Application = null;
    let staffApplication = null;

    // Conditional fetching with school scoping
    if (user.role === "STUDENT") {
      Application = await prisma.application.findFirst({
        where: { studentId: payload.id, schoolId: user.school.id },
        include: { previousSchools: true, familyMembers: true },
      });
    }

    const staffRoles = [
      "ADMIN", "MODERATOR", "PRINCIPAL", "VICE_PRINCIPAL", "TEACHER", "ASSISTANT_TEACHER",
      "COUNSELOR", "LIBRARIAN", "EXAM_OFFICER", "FINANCE", "HR", "RECEPTIONIST",
      "IT_SUPPORT", "TRANSPORT", "NURSE", "COOK", "CLEANER", "SECURITY", "MAINTENANCE",
    ];
    if (staffRoles.includes(user.role)) {
      staffApplication = await prisma.staffApplication.findFirst({
        where: { staffId: payload.id, schoolId: user.school.id },
        include: { previousJobs: true, subjects: true },
      });
    }

    const consolidatedUser: CookieUser = {
      ...user,
      schoolDomain: user.school.domain,
      Application,
      staffApplication,
    };

    // Cache result
    userCache.set(payload.id, { user: consolidatedUser, timestamp: now });

    return consolidatedUser;
  } catch (err) {
    console.error("cookieUser() error:", err);
    return null;
  }
}

/* Example usage:
(async () => {
  const user = await cookieUser();
  if (user) {
    console.log(user.role, user.schoolDomain);
    if (user.Application) console.log(user.Application.grade);
    if (user.staffApplication) console.log(user.staffApplication.position);
  }
})();
*/

/* -------------------------
Design reasoning:
- Fully scopes fetched student/staff applications to the authenticated user's school.
- Prevents cross-school data leakage while maintaining caching for performance.
- Ensures security by verifying JWT and not trusting client-provided role info.

Structure:
- Exports cookieUser() async function.
- Uses in-memory Map cache keyed by user ID with TTL.
- Interfaces: CookieUser for type safety.

Implementation guidance:
- Drop into lib/ and call at top of API routes or server components.
- Adjust CACHE_TTL for balance between freshness and performance.
- Can be combined with additional caching (Redis) for multi-instance scaling.

Scalability insight:
- Easily extendable to new roles or application types.
- School scoping ensures safe multi-tenant use in a larger platform.
------------------------- */
