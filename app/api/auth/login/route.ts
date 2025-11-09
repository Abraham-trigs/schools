// app/api/auth/login/route.ts
// Purpose: Authenticate user and return minimal info with role & school domain

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@lib/db.ts";
import { signJwt } from "@lib/jwt.ts";
import { COOKIE_NAME, COOKIE_OPTIONS } from "@lib/cookies.ts";
import { inferRoleFromPosition, inferDepartmentFromPosition } from "@lib/api/constants/roleInference.ts";

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
      include: { staff: true, school: true },
    });

    if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    // Infer role & department from staff position (if staff)
    let role = user.role;
    let department: string | undefined;
    if (user.staff?.position) {
      role = inferRoleFromPosition(user.staff.position);
      department = inferDepartmentFromPosition(user.staff.position);
    }

    const token = signJwt({ id: user.id, role, schoolId: user.schoolId });

    const res = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role,
        school: { id: user.school.id, name: user.school.name, domain: user.school.domain },
        department,
      },
      message: "Login successful",
    });

    res.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS);
    return res;

  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors.map(e => e.message).join(", ") }, { status: 400 });
    }
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
