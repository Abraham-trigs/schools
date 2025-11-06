import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cookieUser } from "@/lib/cookieUser";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { inferRoleFromPosition } from "@/lib/api/constants/roleInference";

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

  const where = {
    AND: [
      { user: { schoolId: user.schoolId, role: { in: [Role.STUDENT, Role.CLASS_REP] } } },
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
