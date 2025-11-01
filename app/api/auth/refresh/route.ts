import { NextRequest, NextResponse } from "next/server";
import { verifyJwt, signJwt } from "@/lib/jwt";
import { COOKIE_NAME, COOKIE_OPTIONS } from "@/lib/cookies";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ message: "No token" }, { status: 401 });

    const payload = verifyJwt(token);
    const newToken = signJwt(payload);

    const res = NextResponse.json({ message: "Token refreshed" });
    res.cookies.set(COOKIE_NAME, newToken, COOKIE_OPTIONS);
    return res;
  } catch (error) {
    console.error("Refresh error:", error);
    return NextResponse.json({ message: "Invalid token" }, { status: 401 });
  }
}
