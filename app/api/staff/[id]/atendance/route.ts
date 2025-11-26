// app/api/staffAttendance/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SchoolAccount } from "@/lib/schoolAccount";
import { z } from "zod";
import { Role } from "@prisma/client";

const attendanceSchema = z.object({
  date: z.string().optional(),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]),
  timeIn: z.string().optional(),
  timeOut: z.string().optional(),
  remarks: z.string().optional(),
});

// =====================
// GET Attendance Records
// =====================
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const schoolAccount = await SchoolAccount.init();
  if (!schoolAccount) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  // Only fetch staff in the same school
  const records = await prisma.staffAttendance.findMany({
    where: {
      staffId: params.id,
      staff: { schoolId: schoolAccount.schoolId },
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(records);
}

// =====================
// POST Create Attendance Record
// =====================
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const schoolAccount = await SchoolAccount.init();
  if (!schoolAccount) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  // Role-based access: Only Admin, Principal, or HR can create attendance
  if (![Role.ADMIN, Role.PRINCIPAL, Role.HR].includes(schoolAccount.role))
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const parsed = attendanceSchema.parse(body);

    const attendance = await prisma.staffAttendance.create({
      data: {
        staffId: params.id,
        status: parsed.status,
        date: parsed.date ? new Date(parsed.date) : new Date(),
        timeIn: parsed.timeIn ? new Date(parsed.timeIn) : null,
        timeOut: parsed.timeOut ? new Date(parsed.timeOut) : null,
        remarks: parsed.remarks,
      },
    });

    return NextResponse.json(attendance, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json({ message: err.message || "Failed to create attendance" }, { status: 500 });
  }
}
