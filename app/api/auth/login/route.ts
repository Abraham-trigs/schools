import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { signJwt } from "@/lib/jwt";
import { COOKIE_NAME, COOKIE_OPTIONS } from "@/lib/cookies";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = loginSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email },
      include: { school: true },
    });

    if (!user) return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });

    const token = signJwt({ id: user.id, role: user.role, schoolId: user.schoolId });

    const res = NextResponse.json({ message: "Login successful" });
    res.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS);
    return res;
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.errors.map(e => e.message).join(", ") }, { status: 400 });
    }
    console.error("Login error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
