// app/api/students/[id]/route.ts
// Handles single student fetch, update, and deletion with user-student transactional updates

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cookieUser } from "@/lib/cookieUser";
import { Role, AttendanceStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";

// Zod schema for PATCH updates
const studentUpdateSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  classId: z.string().nullable().optional(),
});

// GET single student + attendances summary
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = await cookieUser(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const student = await prisma.student.findUnique({
    where: { id: params.id },
    include: {
      user: true,
      class: true,
      parents: true,
      exams: true,
      transactions: true,
      attendances: {
        orderBy: { date: "desc" },
        take: 30,
      },
    },
  });

  if (!student) return NextResponse.json({ message: "Student not found" }, { status: 404 });
  if (student.user.schoolId !== user.schoolId)
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  // Attendances summary
  const totalRecords = student.attendances.length;
  const summary = {
    total: totalRecords,
    present: student.attendances.filter(a => a.status === AttendanceStatus.PRESENT).length,
    absent: student.attendances.filter(a => a.status === AttendanceStatus.ABSENT).length,
    late: student.attendances.filter(a => a.status === AttendanceStatus.LATE).length,
    excused: student.attendances.filter(a => a.status === AttendanceStatus.EXCUSED).length,
  };

  return NextResponse.json({
    ...student,
    attendancesSummary: summary,
  });
}

// PATCH update student
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await cookieUser(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (![Role.ADMIN, Role.PRINCIPAL, Role.TEACHER].includes(user.role))
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const data = studentUpdateSchema.parse(body);

    const updateData: any = {};
    if ("classId" in data) updateData.classId = data.classId;

    const userData: any = {};
    if (data.name) userData.name = data.name;
    if (data.email) userData.email = data.email;
    if (data.password) userData.password = await bcrypt.hash(data.password, 10);

    // Transaction to update student and user together
    const updated = await prisma.$transaction(async (tx) => {
      const student = await tx.student.update({
        where: { id: params.id },
        data: updateData,
        include: { user: true, class: true },
      });

      if (Object.keys(userData).length > 0) {
        await tx.user.update({
          where: { id: student.userId },
          data: userData,
        });
      }

      return tx.student.findUnique({
        where: { id: params.id },
        include: {
          user: true,
          class: true,
          parents: true,
          exams: true,
          transactions: true,
          attendances: true,
        },
      });
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json(
      { message: err.message || "Failed to update student" },
      { status: 400 }
    );
  }
}

// DELETE student
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = await cookieUser(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (![Role.ADMIN, Role.PRINCIPAL].includes(user.role))
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  await prisma.student.delete({ where: { id: params.id } });
  return NextResponse.json({ message: "Student deleted" }, { status: 200 });
}
