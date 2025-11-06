// app/api/students/[id]/route.ts
// Purpose: Handle single student operations (GET, PATCH, DELETE) with domain-based access control

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cookieUser } from "@/lib/cookieUser";
import { Role, AttendanceStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";

const studentUpdateSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  classId: z.string().nullable().optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await cookieUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const student = await prisma.student.findUnique({
    where: { id: params.id },
    include: {
      user: { include: { school: true } },
      class: true,
      parents: true,
      exams: true,
      transactions: true,
      attendances: { orderBy: { date: "desc" }, take: 30 },
    },
  });

  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });
  if (student.user.school.id !== user.schoolId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const summary = {
    total: student.attendances.length,
    present: student.attendances.filter(a => a.status === AttendanceStatus.PRESENT).length,
    absent: student.attendances.filter(a => a.status === AttendanceStatus.ABSENT).length,
    late: student.attendances.filter(a => a.status === AttendanceStatus.LATE).length,
    excused: student.attendances.filter(a => a.status === AttendanceStatus.EXCUSED).length,
  };

  return NextResponse.json({ data: student, attendancesSummary: summary });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await cookieUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (![Role.ADMIN, Role.PRINCIPAL, Role.TEACHER].includes(user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const data = studentUpdateSchema.parse(body);

    const updateData: any = {};
    if ("classId" in data) updateData.classId = data.classId;

    const userData: any = {};
    if (data.name) userData.name = data.name;
    if (data.email) userData.email = data.email;
    if (data.password) userData.password = await bcrypt.hash(data.password, 10);

    const updated = await prisma.$transaction(async (tx) => {
      const student = await tx.student.update({
        where: { id: params.id },
        data: updateData,
        include: { user: true, class: true, parents: true, exams: true, transactions: true, attendances: true },
      });
      if (Object.keys(userData).length > 0)
        await tx.user.update({ where: { id: student.userId }, data: userData });
      return student;
    });

    return NextResponse.json({ data: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update student" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await cookieUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (![Role.ADMIN, Role.PRINCIPAL].includes(user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.student.delete({ where: { id: params.id } });
  return NextResponse.json({ data: "Student deleted" }, { status: 200 });
}

/*
Design reasoning → Full CRUD per student with transactional PATCH; domain-level auth; ensures data consistency and user/student sync.
Structure → GET (summary), PATCH (transactional update), DELETE
Implementation guidance → Connect with store fetchStudent/updateStudent/deleteStudent; use optimistic UI updates for PATCH
Scalability insight → Partial updates, role-based field visibility, additional related entities (exams, parents) easily extendable
*/
