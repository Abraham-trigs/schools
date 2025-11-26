// app/api/classes/[id]/attendance/route.ts
import { NextResponse } from "next/server";
import { prisma, Role } from "@/lib/db";
import { SchoolAccount } from "@/lib/schoolAccount";
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

// -------------------- GET Class Attendance --------------------
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const schoolAccount = await SchoolAccount.init();
  if (!schoolAccount)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const dateQuery = searchParams.get("date");
  const date = dateQuery ? new Date(dateQuery) : new Date();

  const startOfDay = new Date(date.setHours(0, 0, 0, 0));
  const endOfDay = new Date(date.setHours(23, 59, 59, 999));

  const attendance = await prisma.studentAttendance.findMany({
    where: {
      student: {
        classId: params.id,
        class: { schoolId: schoolAccount.schoolId }, // school scoping
      },
      date: { gte: startOfDay, lte: endOfDay },
    },
    include: { student: { include: { user: { select: { id: true, name: true, email: true } } } } },
    orderBy: { student: { user: { name: "asc" } } },
  });

  return NextResponse.json(attendance);
}

// -------------------- POST Bulk Attendance --------------------
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const schoolAccount = await SchoolAccount.init();
  if (!schoolAccount)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  // Role-based access
  if (![Role.ADMIN, Role.TEACHER].includes(schoolAccount.role))
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const data = attendanceSchema.parse(body);
    const date = data.date ? new Date(data.date) : new Date();

    // Ensure class belongs to user's school
    const cls = await prisma.class.findFirst({
      where: { id: params.id, schoolId: schoolAccount.schoolId },
      include: { students: true },
    });
    if (!cls)
      return NextResponse.json({ message: "Class not found" }, { status: 404 });

    // Bulk upsert attendance records
    const results = await prisma.$transaction(
      data.records.map((r) =>
        prisma.studentAttendance.upsert({
          where: {
            studentId_date: {
              studentId: r.studentId,
              date: new Date(date.toDateString()), // per-day uniqueness
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
