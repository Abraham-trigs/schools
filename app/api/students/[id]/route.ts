import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cookieUser } from "@/lib/cookieUser";
import { Role, AttendanceStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";

// --- Validation schema for PATCH ---
const studentUpdateSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  classId: z.string().nullable().optional(),
});

// --- Helper to get studentId safely ---
async function resolveParams(context: { params: any }) {
  const params = await context.params;
  return params.id;
}

// --- GET student ---
export async function GET(req: NextRequest, context: { params: any }) {
  const studentId = await resolveParams(context);

  const user = await cookieUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const student = await prisma.student.findFirst({
    where: { id: studentId, user: { schoolId: user.schoolId } },
    include: {
      user: true,
      class: true,
      parents: true,
      exams: true,
      transactions: true,
      attendances: { orderBy: { date: "desc" }, take: 30 },
    },
  });

  if (!student)
    return NextResponse.json({ error: "Student not found or access forbidden" }, { status: 404 });

  const summary = {
    total: student.attendances.length,
    present: student.attendances.filter(a => a.status === AttendanceStatus.PRESENT).length,
    absent: student.attendances.filter(a => a.status === AttendanceStatus.ABSENT).length,
    late: student.attendances.filter(a => a.status === AttendanceStatus.LATE).length,
    excused: student.attendances.filter(a => a.status === AttendanceStatus.EXCUSED).length,
  };

  return NextResponse.json({ data: student, attendancesSummary: summary });
}

// --- PATCH student ---
export async function PATCH(req: NextRequest, context: { params: any }) {
  const studentId = await resolveParams(context);

  const user = await cookieUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (![Role.ADMIN, Role.PRINCIPAL, Role.TEACHER].includes(user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const data = studentUpdateSchema.parse(body);

  const updateData: any = {};
  if ("classId" in data) updateData.classId = data.classId;

  const userData: any = {};
  if (data.name) userData.name = data.name;
  if (data.email) userData.email = data.email;
  if (data.password) userData.password = await bcrypt.hash(data.password, 10);

  const updated = await prisma.$transaction(async (tx) => {
    const studentCount = await tx.student.count({
      where: { id: studentId, user: { schoolId: user.schoolId } },
    });
    if (studentCount === 0) throw new Error("Student not found or access forbidden");

    if (Object.keys(updateData).length > 0)
      await tx.student.update({
        where: { id: studentId },
        data: updateData,
      });

    if (Object.keys(userData).length > 0) {
      const student = await tx.student.findUnique({ where: { id: studentId } });
      if (!student) throw new Error("Student not found during update");
      await tx.user.update({ where: { id: student.userId }, data: userData });
    }

    return tx.student.findUnique({
      where: { id: studentId },
      include: { user: true, class: true, parents: true, exams: true, transactions: true, attendances: true },
    });
  });

  return NextResponse.json({ data: updated });
}

// --- DELETE student ---
export async function DELETE(req: NextRequest, context: { params: any }) {
  const studentId = await resolveParams(context);

  const user = await cookieUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (![Role.ADMIN, Role.PRINCIPAL].includes(user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const deleted = await prisma.student.deleteMany({
    where: { id: studentId, user: { schoolId: user.schoolId } },
  });

  if (deleted.count === 0)
    return NextResponse.json({ error: "Student not found or access forbidden" }, { status: 404 });

  return NextResponse.json({ data: "Student deleted" }, { status: 200 });
}
