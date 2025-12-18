// app/api/auth/refresh/route.ts
// Purpose: Refresh JWT for authenticated user while keeping schoolDomain and role
// Production-ready: Fully uses SchoolAccount to ensure accurate role/school, avoids redundant queries

import { NextRequest, NextResponse } from "next/server";
import { signJwt } from "@/lib/jwt.ts";
import { COOKIE_NAME, COOKIE_OPTIONS } from "@/lib/cookies.ts";
import { SchoolAccount } from "@/lib/schoolAccount.ts";

export async function POST(req: NextRequest) {
  try {
    // Initialize school-scoped account from JWT cookie
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Re-sign JWT using preloaded data
    const newToken = signJwt({
      id: schoolAccount.info.id,
      role: schoolAccount.role,
      schoolDomain: schoolAccount.school.domain,
    });

    // Set refreshed cookie
    const res = NextResponse.json({ message: "Token refreshed" });
    res.cookies.set(COOKIE_NAME, newToken, COOKIE_OPTIONS);

    return res;
  } catch (err: any) {
    console.error("POST /api/auth/refresh error:", err);
    return NextResponse.json({ error: "Failed to refresh token" }, { status: 500 });
  }
}
