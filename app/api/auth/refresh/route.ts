// app/api/auth/refresh/route.ts
// Purpose: Refresh JWT for authenticated user, keep schoolDomain in payload

import { NextRequest, NextResponse } from "next/server";
import { signJwt, verifyJwt } from "@/lib/jwt";
import { COOKIE_NAME, COOKIE_OPTIONS } from "@lib/cookies.ts";
import { cookieUser } from "@lib/cookieUser.ts";

export async function POST(req: NextRequest) {
  try {
    const user = await cookieUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    // Re-sign JWT with current payload
    const newToken = signJwt({
      id: user.id,
      role: user.role,
      schoolDomain: user.schoolDomain,
    });

    const res = NextResponse.json({ message: "Token refreshed" });
    res.cookies.set(COOKIE_NAME, newToken, COOKIE_OPTIONS);
    return res;
  } catch (err) {
    console.error("POST /api/auth/refresh error:", err);
    return NextResponse.json({ error: "Failed to refresh token" }, { status: 500 });
  }
}

/* Example usage:
POST /api/auth/refresh
Sets a new JWT cookie with updated expiration
*/
