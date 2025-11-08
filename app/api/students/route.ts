// app/api/students/route.ts
// Purpose: API route for listing and creating students, now scoped by classId if provided.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cookieUser } from "@/lib/cookieUser";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { inferRoleFromPosition } from "@/lib/api/constants/roleInference.ts";

// --- Validation schema for POST ---
const studentSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  classId: z.string(),
  enrolledAt: z
    .preprocess((val) => (val ? new Date(val as string) : undefined), z.date())
    .optional(),
});

export async function GET(req: NextRequest) {
  // ---------------------------
  // Auth
  // ---------------------------
  const user = await cookieUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ---------------------------
  // Query params
  // ---------------------------
  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page") || 1);
  const perPage = Number(searchParams.get("perPage") || 10);
  const search = searchParams.get("search") || "";
  const classId = searchParams.get("classId"); // optional class filter

  // ---------------------------
  // Build Prisma where clause
  // ---------------------------
  const where: any = {
    user: {
      schoolId: user.schoolId,
      role: { in: [Role.STUDENT, Role.CLASS_REP] },
    },
  };

  if (search) {
    where.OR = [
      { user: { name: { contains: search, mode: "insensitive" } } },
      { user: { email: { contains: search, mode: "insensitive" } } },
    ];
  }

  if (classId) {
    where.classId = classId; // only students in this class
  }

  // ---------------------------
  // Fetch total & students
  // ---------------------------
  const total = await prisma.student.count({ where });
  const students = await prisma.student.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true } },
      class: { select: { id: true, name: true } },
      parents: true,
      exams: true,
      transactions: true,
      attendances: true,
    },
    skip: (page - 1) * perPage,
    take: perPage,
    orderBy: { user: { name: "asc" } },
  });

  // ---------------------------
  // Return result
  // ---------------------------
  if (students.length === 0) {
    return NextResponse.json({ data: [], total, page, perPage, message: "No students in this class" });
  }

  return NextResponse.json({ data: students, total, page, perPage });
}

export async function POST(req: NextRequest) {
  const user = await cookieUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowedRoles: Role[] = ["ADMIN", "PRINCIPAL"].map(inferRoleFromPosition);
  if (!allowedRoles.includes(user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const data = studentSchema.parse(body);

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const newUser = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: Role.STUDENT,
      schoolId: user.schoolId,
      student: {
        create: {
          classId: data.classId,
          enrolledAt: data.enrolledAt ?? new Date(),
        },
      },
    },
    include: {
      student: {
        include: {
          class: true,
          parents: true,
          exams: true,
          transactions: true,
          attendances: true,
        },
      },
    },
  });

  return NextResponse.json({
    data: {
      ...newUser.student,
      user: { id: newUser.id, name: newUser.name, email: newUser.email },
    },
  }, { status: 201 });
}

/* 
Design reasoning →
- Added optional `classId` filtering to support class-specific student lists.
- Returns a clear "No students in this class" message if no students found.
- Maintains search, pagination, and school-scoped security.
- Server-side filtering prevents exposing students from other classes/schools.

Structure →
- GET: list students (supports search, pagination, optional classId)
- POST: create a new student (validated + hashed password)
- Uses cookieUser() for auth and role checks

Implementation guidance →
- Frontend should pass `classId` when opening the StudentsModal:
  `/api/students?classId=<id>&page=1&perPage=10`
- `search` param optional; defaults to "".
- Pagination uses `page` and `perPage`.

Scalability insight →
- Can add additional filters (grade, enrollment year, status) in the `where` clause.
- Supports multi-class views without changing UI; simply pass `classId` per modal context.
*/
