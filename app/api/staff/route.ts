// app/api/staff/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookieUser } from "@/lib/cookieUser";
import { z } from "zod";

// ------------------------- Zod schema for POST -------------------------
const staffCreateSchema = z.object({
  userId: z.string().uuid(),
  position: z.string(),
  department: z.string().optional(),
  classId: z.string().optional(),
  salary: z.number().optional(),
  hireDate: z.string().optional(),
});

// ------------------------- GET: List Staff -------------------------
export async function GET(req: NextRequest) {
  const authUser = await cookieUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const search = url.searchParams.get("search") || "";
  const page = Number(url.searchParams.get("page") || 1);
  const perPage = Number(url.searchParams.get("perPage") || 10);

  try {
    const where: any = {};
    if (search) where.user = { name: { contains: search, mode: "insensitive" } };

    const total = await prisma.staff.count({
      where: { ...where, user: { schoolId: authUser.schoolId } },
    });

    const staffList = await prisma.staff.findMany({
      where: { ...where, user: { schoolId: authUser.schoolId } },
      skip: (page - 1) * perPage,
      take: perPage,
      include: { user: true, class: true, department: true, subjects: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ staffList, total, page });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ------------------------- POST: Create Staff -------------------------
export async function POST(req: NextRequest) {
  try {
    const authUser = await cookieUser();
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = staffCreateSchema.parse(body);

    // Ensure the user exists and belongs to the same school
    const user = await prisma.user.findUnique({ where: { id: parsed.userId } });
    if (!user || user.schoolId !== authUser.schoolId)
      return NextResponse.json({ error: "Invalid user" }, { status: 400 });

    // Create staff record
    const staff = await prisma.staff.create({
      data: {
        userId: parsed.userId,
        role: parsed.position, // or map position to role if needed
        department: parsed.department,
        classId: parsed.classId,
        salary: parsed.salary,
        hireDate: parsed.hireDate ? new Date(parsed.hireDate) : undefined,
        schoolId: authUser.schoolId,
      },
      include: { user: true, class: true },
    });

    return NextResponse.json(staff, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server error" }, { status: 400 });
  }
}
