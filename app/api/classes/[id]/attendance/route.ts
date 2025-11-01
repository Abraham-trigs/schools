import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cookieUser } from "@/lib/cookieUser";
import { z } from "zod";
import { Role } from "@prisma/client";

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

// GET class attendance (all students for a given day)
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = await cookieUser(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const dateQuery = searchParams.get("date");
  const date = dateQuery ? new Date(dateQuery) : new Date();

  const startOfDay = new Date(date.setHours(0, 0, 0, 0));
  const endOfDay = new Date(date.setHours(23, 59, 59, 999));

  const attendance = await prisma.studentAttendance.findMany({
    where: {
      student: { classId: params.id },
      date: { gte: startOfDay, lte: endOfDay },
    },
    include: { student: { include: { user: true } } },
    orderBy: { student: { user: { name: "asc" } } },
  });

  return NextResponse.json(attendance);
}

// POST bulk class attendance
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await cookieUser(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (![Role.ADMIN, Role.TEACHER].includes(user.role))
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const data = attendanceSchema.parse(body);
    const date = data.date ? new Date(data.date) : new Date();

    // Ensure class exists
    const cls = await prisma.class.findUnique({
      where: { id: params.id },
      include: { Student: true },
    });
    if (!cls) return NextResponse.json({ message: "Class not found" }, { status: 404 });

    // Bulk insert or upsert
    const results = await prisma.$transaction(
      data.records.map(r =>
        prisma.studentAttendance.upsert({
          where: {
            studentId_date: {
              studentId: r.studentId,
              date: new Date(date.toDateString()), // Ensure per-day uniqueness
            },
          },
          update: {
            status: r.status,
            timeIn: r.timeIn ? new Date(r.timeIn) : null,
            timeOut: r.timeOut ? new Date(r.timeOut) : null,
            remarks: r.remarks,
          },
          create: {
            studentId: r.studentId,
            date,
            status: r.status,
            timeIn: r.timeIn ? new Date(r.timeIn) : null,
            timeOut: r.timeOut ? new Date(r.timeOut) : null,
            remarks: r.remarks,
          },
        })
      )
    );

    return NextResponse.json({ success: true, count: results.length }, { status: 201 });
  } catch (error: any) {
    console.error("Bulk attendance error:", error);
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
