// app/api/staff/route.ts
// Handles listing and creating Staff with auth, validation, role & department inference, class assignment, and hashed password

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma.ts";
import { z } from "zod";
import { cookieUser } from "@/lib/cookieUser.ts";
import { inferRoleFromPosition, inferDepartmentFromPosition, requiresClass } from "@/lib/api/constants/roleInference.ts";
import bcrypt from "bcryptjs";

// Validation schema
const staffSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  position: z.string().optional().nullable(),
  classId: z.string().optional().nullable(),
  salary: z.preprocess(
    (val) => (val === "" ? null : Number(val)),
    z.number().nullable().optional()
  ),
  subject: z.string().optional().nullable(),
  hireDate: z.preprocess(
    (val) => (val ? new Date(val as string) : null),
    z.date().nullable().optional()
  ),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// GET: list staff with optional search & pagination
export async function GET(req: NextRequest) {
  const user = await cookieUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const search = url.searchParams.get("search") || "";
  const page = Number(url.searchParams.get("page") || 1);
  const perPage = Number(url.searchParams.get("perPage") || 10);

  const where = search
    ? {
        OR: [
          { user: { name: { contains: search, mode: "insensitive" } } },
          { user: { email: { contains: search, mode: "insensitive" } } },
        ],
      }
    : {};

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

  return NextResponse.json({ staffList, total, page });
}

// POST: create new staff
export async function POST(req: NextRequest) {
  const user = await cookieUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = staffSchema.parse(body);

    // Infer role and department
    const role = inferRoleFromPosition(data.position);
    const departmentName = inferDepartmentFromPosition(data.position);

    // Fetch department ID if exists
    const department = departmentName
      ? await prisma.department.findUnique({ where: { name: departmentName } })
      : null;

    return await prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({ where: { email: data.email } });
      if (existingUser) return NextResponse.json({ error: "User with email exists" }, { status: 400 });

      // Hash password before storing
      const hashedPassword = await bcrypt.hash(data.password, 10);

      const newUser = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashedPassword,
          role,
          schoolId: user.schoolId,
        },
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
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
