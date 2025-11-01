import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cookieUser } from "@/lib/cookieUser";
import { z } from "zod";
import { Role } from "@prisma/client";

const studentAttendanceSchema = z.object({
  date: z.string().optional(),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]),
  timeIn: z.string().optional(),
  timeOut: z.string().optional(),
  remarks: z.string().optional(),
});

// GET all student attendance
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = await cookieUser(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const records = await prisma.studentAttendance.findMany({
    where: { studentId: params.id },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(records);
}

// POST new student attendance
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await cookieUser(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (![Role.ADMIN, Role.TEACHER].includes(user.role))
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const data = studentAttendanceSchema.parse(body);

    const record = await prisma.studentAttendance.create({
      data: {
        studentId: params.id,
        date: data.date ? new Date(data.date) : new Date(),
        status: data.status,
        timeIn: data.timeIn ? new Date(data.timeIn) : null,
        timeOut: data.timeOut ? new Date(data.timeOut) : null,
        remarks: data.remarks,
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
