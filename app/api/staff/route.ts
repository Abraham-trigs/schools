import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db.ts";
import { SchoolAccount } from "@/lib/schoolAccount.ts";
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
  const schoolAccount = await SchoolAccount.init();
  if (!schoolAccount) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const search = url.searchParams.get("search") || "";
  const page = Number(url.searchParams.get("page") || 1);
  const perPage = Number(url.searchParams.get("perPage") || 10);

  try {
    const where: any = { user: { schoolId: schoolAccount.schoolId } };
    if (search) where.user.name = { contains: search, mode: "insensitive" };

    const total = await prisma.staff.count({ where });

    const staffList = await prisma.staff.findMany({
      where,
      skip: (page - 1) * perPage,
      take: perPage,
      include: { user: true, class: true, department: true, subjects: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ staffList, total, page });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

// ------------------------- POST: Create Staff -------------------------
export async function POST(req: NextRequest) {
  const schoolAccount = await SchoolAccount.init();
  if (!schoolAccount) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = staffCreateSchema.parse(body);

    // Ensure the user exists and belongs to the same school
    const user = await prisma.user.findUnique({ where: { id: parsed.userId } });
    if (!user || user.schoolId !== schoolAccount.schoolId)
      return NextResponse.json({ error: "Invalid user" }, { status: 400 });

    const staff = await prisma.staff.create({
      data: {
        userId: parsed.userId,
        role: parsed.position, // map position to role if needed
        department: parsed.department,
        classId: parsed.classId,
        salary: parsed.salary,
        hireDate: parsed.hireDate ? new Date(parsed.hireDate) : undefined,
        schoolId: schoolAccount.schoolId,
      },
      include: { user: true, class: true },
    });

    return NextResponse.json(staff, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 400 });
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
