import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cookieUser } from "@/lib/cookieUser";
import { Role, AttendanceStatus } from "@prisma/client";

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
        take: 30, // last 30 attendances entries
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

  const body = await req.json();

  const student = await prisma.student.update({
    where: { id: params.id },
    data: {
      classId: body.classId,
    },
    include: { user: true, class: true },
  });

  return NextResponse.json(student);
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
