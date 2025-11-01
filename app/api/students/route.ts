import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cookieUser } from "@/lib/cookieUser";
import { z } from "zod";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const studentSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  classId: z.string(), // required now
  enrolledAt: z.string().optional(),
});

// GET all students for logged-in user's school
export async function GET(req: Request) {
  const user = await cookieUser(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page") || "1");
  const perPage = Number(searchParams.get("perPage") || "10");
  const search = searchParams.get("search") || "";
  const where = {
    user: {
      schoolId: user.schoolId,
      role: { in: [Role.STUDENT, Role.CLASS_REP] },
      OR: search
        ? [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ]
        : undefined,
    },
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

  return NextResponse.json({ students, total, page, perPage });
}

// POST create student
export async function POST(req: Request) {
  const user = await cookieUser(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = studentSchema.parse(body);

    const hashedPassword = await bcrypt.hash(data.password, 10);

const newStudent = await prisma.user.create({
  data: {
    name: data.name,
    email: data.email,
    password: hashedPassword,
    role: Role.STUDENT,
    schoolId: user.schoolId,
    student: {
      create: {
        classId: data.classId,
        enrolledAt: data.enrolledAt ? new Date(data.enrolledAt) : new Date(),
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

    // Return the "student object" for frontend consumption
    return NextResponse.json({
  Student: {
    ...newStudent.student,
    user: { id: newStudent.id, name: newStudent.name, email: newStudent.email },
  },
}, { status: 201 });

  } catch (err: any) {
    return NextResponse.json({ message: err.message || "Failed to add student" }, { status: 400 });
  }
}
