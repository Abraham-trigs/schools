// src/app/api/students/[id]/class/route.ts
// Purpose: Fetch the class information for a specific student by ID.
// Includes authentication, error handling, and prisma query with relations.

import { NextResponse } from "next/server"; // Next.js response helpers for returning JSON and status codes
import { prisma } from "@/lib/db"; // Prisma client for database access
import { cookieUser } from "@/lib/cookieUser"; // Helper to authenticate user via cookies/session

/**
 * GET: Retrieve class info for a specific student
 * @param req - Native Request object from Next.js route handler
 * @param params - Object containing route parameters, specifically student ID
 * @returns NextResponse with class data or error message
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  // -------------------------
  // Authenticate user
  // -------------------------
  // cookieUser reads session/cookie and returns logged-in user or null
  const user = await cookieUser(req);
  if (!user)
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 } // 401 Unauthorized if user is not logged in
    );

  // -------------------------
  // Query student by ID
  // -------------------------
  // Prisma query to find the student including related class
  const student = await prisma.student.findUnique({
    where: { id: params.id }, // Match student by provided ID from route
    include: { class: true }, // Include related class info (id, name, etc.)
  });

  // -------------------------
  // Handle missing student
  // -------------------------
  if (!student)
    return NextResponse.json(
      { message: "Student not found" },
      { status: 404 } // 404 Not Found if no student matches the ID
    );

  // -------------------------
  // Return the class data
  // -------------------------
  // Only return the class object, not the full student record
  return NextResponse.json(student.class);
}

/**
 * -------------------------
 * Notes / Annotations
 * -------------------------
 * - Auth: `cookieUser` ensures only logged-in users can access student info.
 * - Prisma: `findUnique` fetches exactly one student; include relations as needed.
 * - Error handling: Consistent JSON shape `{ message: string }` for errors.
 * - Returns: Only `student.class` object to avoid exposing unrelated student info.
 * - Security: Avoid exposing other student fields to unauthorized users.
 * - Extendability: Can add additional checks like schoolId matching to restrict cross-school access.
 */
