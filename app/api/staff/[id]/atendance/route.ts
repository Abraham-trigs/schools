import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cookieUser } from "@/lib/cookieUser";
import { z } from "zod";
import { Role } from "@prisma/client";

const attendanceSchema = z.object({
  date: z.string().optional(),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]),
  timeIn: z.string().optional(),
  timeOut: z.string().optional(),
  remarks: z.string().optional(),
});

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = await cookieUser(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const records = await prisma.staffAttendance.findMany({
    where: { staffId: params.id },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(records);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await cookieUser(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (![Role.ADMIN, Role.PRINCIPAL, Role.HR].includes(user.role))
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
    return NextResponse.json({ message: err.message }, { status: 400 });
  }
}
