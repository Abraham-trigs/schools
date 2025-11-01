import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cookieUser } from "@/lib/cookieUser";

export async function GET() {
  try {
    const user = await cookieUser();

    if (!user) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    // Optionally, refresh the user data from DB if needed
    const freshUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, name: true, role: true, schoolId: true },
    });

    if (!freshUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(freshUser);
  } catch (err) {
    console.error("GET /api/auth/me error:", err);
    return NextResponse.json({ message: "Failed to fetch user" }, { status: 500 });
  }
}
