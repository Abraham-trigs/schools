// app/api/staff/route.ts
// Purpose: List and create staff scoped to authenticated user's school with pagination, search, filtering, role & department inference, and multi-subject support.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { cookieUser } from "@/lib/cookieUser";
import {
  inferRoleFromPosition,
  inferDepartmentFromPosition,
  requiresClass,
} from "@/lib/api/constants/roleInference.ts";
import bcrypt from "bcryptjs";

// ------------------------- Types -------------------------
interface StaffCreateRequest {
  name: string;
  email: string;
  position?: string | null;
  classId?: string | null;
  salary?: number | null;
  subjects?: string[]; // multiple subjects
  hireDate?: Date | null;
  password: string;
}

// ------------------------- Schemas -------------------------
const staffSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  position: z.string().optional().nullable(),
  classId: z.string().optional().nullable(),
  salary: z
    .preprocess((val) => (val === "" ? null : Number(val)), z.number().nullable().optional()),
  subjects: z.array(z.string()).optional(),
  hireDate: z
    .preprocess((val) => (val ? new Date(val as string) : null), z.date().nullable().optional()),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// ------------------------- GET: List staff -------------------------
export async function GET(req: NextRequest) {
  const user = await cookieUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const search = url.searchParams.get("search") || "";
  const role = url.searchParams.get("role");
  const departmentId = url.searchParams.get("departmentId");
  const page = Number(url.searchParams.get("page") || 1);
  const perPage = Number(url.searchParams.get("perPage") || 10);

  const where: any = { user: { schoolId: user.school.id } };
  if (search) {
    where.OR = [
      { user: { name: { contains: search, mode: "insensitive" } } },
      { user: { email: { contains: search, mode: "insensitive" } } },
    ];
  }
  if (role) where.user.role = role;
  if (departmentId) where.departmentId = departmentId;

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

  const totalPages = Math.ceil(total / perPage);
  return NextResponse.json({ staffList, total, page, perPage, totalPages });
}

// ------------------------- POST: Create staff -------------------------
export async function POST(req: NextRequest) {
  const user = await cookieUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body: StaffCreateRequest = await req.json();
    const data = staffSchema.parse(body);

    const role = inferRoleFromPosition(data.position);
    const departmentName = inferDepartmentFromPosition(data.position);
    const department = departmentName
      ? await prisma.department.findUnique({ where: { name: departmentName } })
      : null;

    return await prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({ where: { email: data.email } });
      if (existingUser) return NextResponse.json({ error: "User with email exists" }, { status: 400 });

      const hashedPassword = await bcrypt.hash(data.password, 10);

      const newUser = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashedPassword,
          role,
          schoolId: user.school.id,
        },
      });

      const newStaff = await tx.staff.create({
        data: {
          userId: newUser.id,
          position: data.position || "Teacher",
          departmentId: department?.id ?? null,
          classId: requiresClass(data.position) ? data.classId : null,
          salary: data.salary ?? null,
          hireDate: data.hireDate ?? null,
          subjects: data.subjects && data.subjects.length
            ? { connect: data.subjects.map((id) => ({ id })) }
            : undefined,
        },
        include: { user: true, class: true, department: true, subjects: true },
      });

      return NextResponse.json(newStaff, { status: 201 });
    });
  } catch (err: any) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: err.flatten() }, { status: 400 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* Design reasoning:
- Multi-subject support via Prisma many-to-many connect.
- GET supports pagination, search, and filtering by role/department.
- POST hashes passwords securely and infers role/department/class.
Structure:
- GET: List staff with subjects included.
- POST: Create staff with multiple subjects.
Implementation guidance:
- Front-end sends subjects as array of IDs.
Scalability insight:
- Adding extra relations (roles/departments) possible without changing core logic.
*/
