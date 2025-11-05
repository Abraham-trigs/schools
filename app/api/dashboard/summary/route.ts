// app/api/summary/route.ts
// Provides summary counts for students, parents, classes, and staff per role

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Role } from "@prisma/client";
import { positionRoleMap } from "@/lib/api/constants/roleInference.ts";

// Response types
interface StaffCount {
  [role: string]: number;
}

interface SummaryResponse {
  students: number;
  parents: number;
  classes: number;
  staff: StaffCount;
}

// GET /api/summary
export async function GET(req: NextRequest) {
  try {
    // Dynamic staff roles from roleInference
    const staffRoles = Object.values(positionRoleMap).filter(
      role => ![Role.STUDENT, Role.PARENT].includes(role)
    );

    // Build array of count queries for all roles + students, parents, classes
    const countQueries = [
      prisma.user.count({ where: { role: Role.STUDENT } }),
      prisma.user.count({ where: { role: Role.PARENT } }),
      prisma.class.count(),
      ...staffRoles.map(role => prisma.user.count({ where: { role } })),
    ];

    // Execute all counts in a single transaction
    const results = await prisma.$transaction(countQueries);

    const students = results[0];
    const parents = results[1];
    const classes = results[2];

    const staffCountsArray = results.slice(3);
    const staff: StaffCount = {};
    staffRoles.forEach((role, idx) => {
      staff[role] = staffCountsArray[idx];
    });

    const response: SummaryResponse = { students, parents, classes, staff };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Summary API error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
