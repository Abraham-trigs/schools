// app/api/staff/route.ts
// Purpose: Handle listing and creating staff with full pagination, search, filtering, auth, role & department inference, and secure password handling.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { cookieUser } from "@/lib/cookieUser";
import { inferRoleFromPosition, inferDepartmentFromPosition, requiresClass } from "@/lib/api/constants/roleInference";
import bcrypt from "bcryptjs";

// ------------------------- Types -------------------------
interface StaffCreateRequest {
  name: string;
  email: string;
  position?: string | null;
  classId?: string | null;
  salary?: number | null;
  subject?: string | null;
  hireDate?: Date | null;
  password: string;
}

// ------------------------- Schemas -------------------------
const staffSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  position: z.string().optional().nullable(),
  classId: z.string().optional().nullable(),
  salary: z.preprocess((val) => (val === "" ? null : Number(val)), z.number().nullable().optional()),
  subject: z.string().optional().nullable(),
  hireDate: z.preprocess((val) => (val ? new Date(val as string) : null), z.date().nullable().optional()),
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

  const where: any = {};
  if (search) {
    where.OR = [
      { user: { name: { contains: search, mode: "insensitive" } } },
      { user: { email: { contains: search, mode: "insensitive" } } },
    ];
  }
  if (role) where.role = role;
  if (departmentId) where.departmentId = departmentId;

  const [staffList, total] = await prisma.$transaction([
    prisma.staff.findMany({
      where,
      include: { user: true, class: true, department: true },
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
        data: { name: data.name, email: data.email, password: hashedPassword, role, schoolId: user.schoolId },
      });

      const newStaff = await tx.staff.create({
        data: {
          userId: newUser.id,
          position: data.position || "Teacher",
          departmentId: department?.id ?? null,
          classId: requiresClass(data.position) ? data.classId : null,
          salary: data.salary ?? null,
          subject: data.subject ?? null,
          hireDate: data.hireDate ?? null,
        },
        include: { user: true, class: true, department: true },
      });

      return NextResponse.json(newStaff, { status: 201 });
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.flatten() }, { status: 400 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* Design reasoning:
- GET supports search, pagination, and filtering by role/department for efficient staff management.
- POST securely hashes passwords and infers role/department to maintain consistency.
Structure:
- GET: list staff
- POST: create new staff
Implementation guidance:
- Use in a staff management page with live search and paginated table.
Scalability insight:
- Additional filters (class, hireDate, etc.) can be added without changing core structure.
*/
