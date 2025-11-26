// lib/cookieUser.ts
// Purpose: Safely retrieve authenticated user from HTTP-only JWT cookie using Prisma Role enum,
//          preload full school object and optional student/staff applications,
//          fully scoped to the user's school, with caching for efficiency.

import { cookies } from "next/headers";
import { prisma, Role } from "@/lib/db.ts";
import { verifyJwt } from "@/lib/jwt.ts";
import { COOKIE_NAME } from "@/lib/cookies.ts";

/** TypeScript interface for returned user shape */
export interface CookieUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  school: {
    id: string;
    name: string;
    domain: string;
  };
  Application?: any;       // optional, detailed Student Application
  staffApplication?: any;  // optional, detailed Staff Application
}

/** In-memory cache for recent user fetches (short TTL) */
const userCache = new Map<string, { user: CookieUser; timestamp: number }>();
const CACHE_TTL = 5000; // milliseconds, adjust for performance/freshness tradeoff

/**
 * Retrieves authenticated user info from JWT cookie, fully school-scoped.
 * Returns null if token invalid or user not found.
 */
export async function cookieUser(): Promise<CookieUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = verifyJwt(token);
    if (!payload?.id) return null;

    // Return cached user if still fresh
    const cached = userCache.get(payload.id);
    const now = Date.now();
    if (cached && now - cached.timestamp < CACHE_TTL) return cached.user;

    // Fetch user with full school object
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      include: {
        school: true,  // preload full school object
      },
    });
    if (!user) return null;

    let Application = null;
    let staffApplication = null;

    // Conditional fetching with school scoping
    if (user.role === Role.STUDENT) {
      Application = await prisma.application.findFirst({
        where: { studentId: payload.id, schoolId: user.school.id },
        include: { previousSchools: true, familyMembers: true },
      });
    }

    const staffRoles: Role[] = [
      Role.ADMIN, Role.MODERATOR, Role.PRINCIPAL, Role.VICE_PRINCIPAL,
      Role.TEACHER, Role.ASSISTANT_TEACHER, Role.COUNSELOR, Role.LIBRARIAN,
      Role.EXAM_OFFICER, Role.FINANCE, Role.HR, Role.RECEPTIONIST,
      Role.IT_SUPPORT, Role.TRANSPORT, Role.NURSE, Role.COOK, Role.CLEANER,
      Role.SECURITY, Role.MAINTENANCE,
    ];
    if (staffRoles.includes(user.role)) {
      staffApplication = await prisma.staffApplication.findFirst({
        where: { staffId: payload.id, schoolId: user.school.id },
        include: { previousJobs: true, subjects: true },
      });
    }

    // Consolidate into typed object
    const consolidatedUser: CookieUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      school: {
        id: user.school.id,
        name: user.school.name,
        domain: user.school.domain,
      },
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

/* -------------------------
Design reasoning:
- Fully scopes applications to authenticated user's school.
- Preloads school object for zero extra Prisma queries in SchoolAccount-based routes.
- Caching for performance without sacrificing security.
- Can be extended to include additional application types or roles.
------------------------- */
