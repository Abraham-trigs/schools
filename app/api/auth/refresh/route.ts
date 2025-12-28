// app/api/auth/refresh/route.ts
// Purpose: Refresh JWT token for authenticated school account

import { NextRequest, NextResponse } from "next/server";
import { signJwt } from "@/lib/jwt.ts";
import { COOKIE_NAME, COOKIE_OPTIONS } from "@/lib/cookies.ts";
import { SchoolAccount } from "@/lib/schoolAccount.ts";
import { inferRoleFromPosition } from "@/lib/api/constants/roleInference.ts";

// -------------------- POST /refresh --------------------
export async function POST(_req: NextRequest) {
  try {
    // Authenticate using argument-free SchoolAccount
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount)
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    // Determine authoritative role
    let role: string = schoolAccount.role;
    if (schoolAccount.staffApplication?.position) {
      role = inferRoleFromPosition(schoolAccount.staffApplication.position);
    }

    // Sign JWT using authoritative info
    const newToken = signJwt({
      id: schoolAccount.info.id,
      role,
      schoolId: schoolAccount.school.id,
    });

    const res = NextResponse.json({ message: "Token refreshed" });
    res.cookies.set(COOKIE_NAME, newToken, COOKIE_OPTIONS);

    return res;
  } catch (err: any) {
    console.error("POST /api/auth/refresh error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to refresh token" },
      { status: 500 }
    );
  }
}

/*
Design reasoning:
- Authenticates using server-side SchoolAccount, no client-sent role trusted
- Role is derived from staff position if applicable
- JWT signed with authoritative id, role, and schoolId
- Cookie set server-side to maintain secure session

Structure:
- POST() main handler
- Argument-free init ensures multi-tenant scoping
- Errors handled consistently (401 for auth, 500 for server)

Implementation guidance:
- Drop into /app/api/auth/refresh
- Client calls this to refresh JWT; token stored in secure cookie
- Role inference ensures correct permissions

Scalability insight:
- Can extend to include token expiry, session revocation, or audit logging
- Supports multi-role accounts without changing core logic
*/
