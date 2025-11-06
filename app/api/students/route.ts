// app/api/students/route.ts
// Purpose: Handle collection-level student operations (GET with pagination/search & POST creation) scoped to authenticated user's school

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cookieUser } from "@/lib/cookieUser.ts";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { inferRoleFromPosition } from "@/lib/api/constants/roleInference.ts";

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
  const user = await cookieUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page") || 1);
  const perPage = Number(searchParams.get("perPage") || 10);
  const search = searchParams.get("search") || "";

  // Scoped to logged-in user's school
  const where = {
    AND: [
      { user: { schoolId: user.school.id, role: { in: [Role.STUDENT, Role.CLASS_REP] } } },
      ...(search
        ? [
            {
              OR: [
                { user: { name: { contains: search, mode: "insensitive" } } },
                { user: { email: { contains: search, mode: "insensitive" } } },
              ],
            },
          ]
        : []),
    ],
  };

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

  return NextResponse.json({ data: students, total, page, perPage });
}

export async function POST(req: NextRequest) {
  const user = await cookieUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowedRoles: Role[] = ["ADMIN", "PRINCIPAL"].map(inferRoleFromPosition);
  if (!allowedRoles.includes(user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const data = studentSchema.parse(body);
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const newUser = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: Role.STUDENT,
        schoolId: user.school.id, // Scoped to logged-in user's school
        student: {
          create: {
            classId: data.classId,
            enrolledAt: data.enrolledAt || new Date(),
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
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to add student" }, { status: 400 });
  }
}

/*
Design reasoning → Fully scoped to the logged-in user's school; search, pagination, and nested user fields work correctly for frontend; transactional POST ensures user/student consistency.
Structure → GET (school-scoped, paginated, searchable), POST (validated creation)
Implementation guidance → Replace existing GET/POST handlers; frontend should reference s.user?.name and s.user?.email
Scalability insight → Multi-school admin support, additional filters, and role-based access are easily extendable.
*/
