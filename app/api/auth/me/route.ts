// app/api/auth/me/route.ts
// Purpose: Return authenticated user with minimal role info, school domain, and optional department

import { NextResponse } from "next/server";
import { prisma } from "@lib/db.ts";
import { cookieUser } from "@lib/cookieUser.ts";
import { inferRoleFromPosition, inferDepartmentFromPosition } from "../../../../lib/api/constants/roleInference.ts";

export async function GET() {
  try {
    const user = await cookieUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const freshUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { staff: true, school: true },
    });

    if (!freshUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Infer role & department if staff has a position
    let role = freshUser.role;
    let department: string | undefined;
    if (freshUser.staff?.position) {
      role = inferRoleFromPosition(freshUser.staff.position);
      department = inferDepartmentFromPosition(freshUser.staff.position);
    }

    const responseUser = {
      id: freshUser.id,
      name: freshUser.name,
      email: freshUser.email,
      role,
      school: {
        id: freshUser.school.id,
        name: freshUser.school.name,
        domain: freshUser.school.domain,
      },
      department,
    };

    return NextResponse.json({ user: responseUser }, { status: 200 });
  } catch (err) {
    console.error("GET /api/auth/me error:", err);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

/* Example usage:
GET /api/auth/me
Returns minimal authenticated user info aligned with login response.
*/
