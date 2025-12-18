// app/api/classes/[classId]/attendance/route.ts
// Purpose: GET, POST attendance records for a class

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db.ts";
import { Role } from "@prisma/client";
import { SchoolAccount } from "@/lib/schoolAccount.ts";
import { z } from "zod";

const attendanceSchema = z.object({
  date: z.string().optional(),
  records: z.array(
    z.object({
      studentId: z.string(),
      status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]),
      timeIn: z.string().optional(),
      timeOut: z.string().optional(),
      remarks: z.string().optional(),
    })
  ),
});

export async function GET(req: NextRequest, { params }: { params: { classId: string } }) {
  const schoolAccount = await SchoolAccount.init();
  if (!schoolAccount) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const dateQuery = searchParams.get("date");
  const date = dateQuery ? new Date(dateQuery) : new Date();
  const startOfDay = new Date(date.setHours(0, 0, 0, 0));
  const endOfDay = new Date(date.setHours(23, 59, 59, 999));

  const attendance = await prisma.studentAttendance.findMany({
    where: {
      student: { classId: params.classId, class: { schoolId: schoolAccount.schoolId } },
      date: { gte: startOfDay, lte: endOfDay },
    },
    include: { student: { include: { user: { select: { id: true, name: true, email: true } } } } },
    orderBy: { student: { user: { name: "asc" } } },
  });

  return NextResponse.json(attendance);
}

export async function POST(req: NextRequest, { params }: { params: { classId: string } }) {
  const schoolAccount = await SchoolAccount.init();
  if (!schoolAccount) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (![Role.ADMIN, Role.TEACHER].includes(schoolAccount.role))
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const data = attendanceSchema.parse(body);
    const date = data.date ? new Date(data.date) : new Date();

    const cls = await prisma.class.findFirst({ where: { id: params.classId, schoolId: schoolAccount.schoolId }, include: { students: true } });
    if (!cls) return NextResponse.json({ message: "Class not found" }, { status: 404 });

    const results = await prisma.$transaction(
      data.records.map((r) =>
        prisma.studentAttendance.upsert({
          where: { studentId_date: { studentId: r.studentId, date: new Date(date.toDateString()) } },
          update: { status: r.status, timeIn: r.timeIn ? new Date(r.timeIn) : null, timeOut: r.timeOut ? new Date(r.timeOut) : null, remarks: r.remarks },
          create: { studentId: r.studentId, date, status: r.status, timeIn: r.timeIn ? new Date(r.timeIn) : null, timeOut: r.timeOut ? new Date(r.timeOut) : null, remarks: r.remarks },
        })
      )
    );

    return NextResponse.json({ success: true, count: results.length }, { status: 201 });
  } catch (error: any) {
    console.error("Bulk attendance error:", error);
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
