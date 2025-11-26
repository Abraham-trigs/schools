// app/api/auth/me/route.ts
// Purpose: Return authenticated user profile with minimal role info, preloaded school, and optional department
// Production-ready: Uses SchoolAccount to avoid redundant DB queries, fully school-scoped

import { NextResponse } from "next/server";
import { SchoolAccount } from "@/lib/schoolAccount.ts";
import { inferRoleFromPosition, inferDepartmentFromPosition } from "@/lib/api/constants/roleInference";

export async function GET() {
  try {
    // Initialize school-scoped account from JWT cookie
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Use preloaded staffApplication if available for role/department inference
    let role = schoolAccount.role;
    let department: string | undefined;
    if (schoolAccount.staffApplication?.position) {
      role = inferRoleFromPosition(schoolAccount.staffApplication.position);
      department = inferDepartmentFromPosition(schoolAccount.staffApplication.position);
    }

    // Construct response using preloaded data
    const responseUser = {
      id: schoolAccount.info.id,
      name: schoolAccount.info.name,
      email: schoolAccount.info.email,
      role,
      school: schoolAccount.school,
      department,
    };

    return NextResponse.json({ user: responseUser }, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/auth/me error:", err);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}
