"use server";

// app/api/staff/route.ts
// Purpose: List and create staff scoped to authenticated user's school.
// Features: pagination, search, filtering, role/department inference, multi-subject support.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { cookieUser } from "@/lib/cookieUser";
import {
  inferRoleFromPosition,
  inferDepartmentFromPosition,
  requiresClass,
} from "@/lib/api/constants/roleInference.ts";

// ------------------------- Types & Interfaces -------------------------
interface StaffCreateRequest {
  name: string;
  email: string;
  password: string;
  position?: string | null;
  classId?: string | null;
  salary?: number | null;
  hireDate?: Date | null;
  subjects?: string[];
}

// ------------------------- Input Validation -------------------------
const staffCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  position: z.string().optional().nullable(),
  classId: z.string().optional().nullable(),
  salary: z.preprocess(
    (val) => (val === "" ? null : Number(val)),
    z.number().nullable().optional()
  ),
  hireDate: z.preprocess(
    (val) => (val ? new Date(val as string) : null),
    z.date().nullable().optional()
  ),
  subjects: z.array(z.string()).optional(),
});

// ------------------------- Helper Functions -------------------------

/**
 * Safely fetch a department ID by name scoped to a school
 */
async function findDepartmentId(name: string | null, schoolId: string): Promise<string | null> {
  if (!name) return null;
  const dept = await prisma.department.findUnique({
    where: { name_schoolId: { name, schoolId } },
    select: { id: true },
  });
  return dept?.id ?? null;
}

/**
 * Filter subject IDs by school to avoid invalid connects
 */
async function filterValidSubjectIds(subjectIds: string[] | undefined, schoolId: string): Promise<string[]> {
  if (!subjectIds?.length) return [];
  const validSubjects = await prisma.subject.findMany({
    where: { id: { in: subjectIds }, schoolId },
    select: { id: true },
  });
  return validSubjects.map((s) => s.id);
}

// ------------------------- GET: List Staff -------------------------
export async function GET(req: NextRequest) {
  const user = await cookieUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const search = url.searchParams.get("search")?.trim();
  const role = url.searchParams.get("role")?.trim();
  const departmentId = url.searchParams.get("departmentId")?.trim();
  const page = Math.max(Number(url.searchParams.get("page") || 1), 1);
  const perPage = Math.min(Number(url.searchParams.get("perPage") || 10), 100);

  // Dynamic WHERE filters
  const where: any = { user: { schoolId: user.schoolId } };
  if (search) {
    where.OR = [
      { user: { name: { contains: search, mode: "insensitive" } } },
      { user: { email: { contains: search, mode: "insensitive" } } },
      { position: { contains: search, mode: "insensitive" } },
    ];
  }
  if (role) where.user.role = role;
  if (departmentId) where.departmentId = departmentId;

  try {
    // Fetch paginated staff and total count atomically
    const [staffList, total] = await prisma.$transaction([
      prisma.staff.findMany({
        where,
        include: { user: true, class: true, department: true, subjects: true },
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: "desc" },
      }),
      prisma.staff.count({ where }),
    ]);

    return NextResponse.json({
      staffList,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    });
  } catch (err: any) {
    console.error("GET staff error:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}

// ------------------------- POST: Create Staff -------------------------
export async function POST(req: NextRequest) {
  const user = await cookieUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body: StaffCreateRequest = await req.json();
    const data = staffCreateSchema.parse(body);

    // Determine role & department
    const role = inferRoleFromPosition(data.position);
    const departmentId = await findDepartmentId(inferDepartmentFromPosition(data.position), user.schoolId);

    const validSubjectIds = await filterValidSubjectIds(data.subjects, user.schoolId);

    // Transaction ensures atomic creation
    return await prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({ where: { email: data.email } });
      if (existingUser) return NextResponse.json({ error: "User with email exists" }, { status: 400 });

      const hashedPassword = await bcrypt.hash(data.password, 10);

      const newUser = await tx.user.create({
        data: { name: data.name, email: data.email, password: hashedPassword, role, schoolId: user.schoolId },
      });

      const newStaff = await tx.staff.create({
        data: {
          userId: newUser.id,
          position: data.position ?? "Teacher",
          departmentId,
          classId: requiresClass(data.position) ? data.classId ?? null : null,
          salary: data.salary ?? null,
          hireDate: data.hireDate ?? null,
          subjects: validSubjectIds.length ? { connect: validSubjectIds.map((id) => ({ id })) } : undefined,
        },
        include: { user: true, class: true, department: true, subjects: true },
      });

      return NextResponse.json(newStaff, { status: 201 });
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.flatten() }, { status: 400 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* 
Design reasoning:
- GET: Efficient paginated listing with search & filter.
- POST: Secure user creation + staff creation, multi-subject assignment, role/department inference.
Structure:
- Helpers handle department lookup and subject filtering for school scoping.
- Transaction ensures atomic creation.
Implementation guidance:
- Send subjects as array of IDs; optional hireDate, salary, classId.
Scalability:
- Works with hundreds/thousands of subjects efficiently; dynamic filters prevent heavy queries.
*/
