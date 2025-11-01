import { NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/cookies";

export async function POST() {
  const res = NextResponse.json({ message: "Logged out successfully" });
  res.cookies.set(COOKIE_NAME, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", expires: new Date(0), path: "/" });
  return res;
}
