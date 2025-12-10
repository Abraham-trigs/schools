import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db.ts";
import { SchoolAccount } from "@/lib/schoolAccount.ts";
import { z } from "zod";

// ---------------- Query Validation ----------------
const querySchema = z.object({
  page: z.string().optional(),
  perPage: z.string().optional(),
  search: z.string().optional(),
  classId: z.string().optional(),
  gradeId: z.string().optional(),
});

// ---------------- Create/Update Payload ----------------
const studentSchema = z.object({
  userId: z.string(),
  classId: z.string().optional(),
  gradeId: z.string().optional(),
  enrolledAt: z.string().optional(), // ISO string
});

export async function GET(req: NextRequest) {
  try {
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const query = querySchema.parse(Object.fromEntries(searchParams.entries()));

    const page = Number(query.page || 1);
    const perPage = Number(query.perPage || 20);
    const skip = (page - 1) * perPage;

    const where: any = { schoolId: schoolAccount.schoolId };
    if (query.search) {
      where.OR = [
        { user: { firstName: { contains: query.search, mode: "insensitive" } } },
        { user: { surname: { contains: query.search, mode: "insensitive" } } },
        { user: { otherNames: { contains: query.search, mode: "insensitive" } } },
      ];
    }
    if (query.classId) where.classId = query.classId;
    if (query.gradeId) where.gradeId = query.gradeId;

    const [students, total] = await prisma.$transaction([
      prisma.student.findMany({
        where,
        include: {
          user: true,
          class: true,
          grade: true,
          application: { include: { previousSchools: true, familyMembers: true, admissionPayment: true } },
        },
        skip,
        take: perPage,
        orderBy: { enrolledAt: "desc" },
      }),
      prisma.student.count({ where }),
    ]);

    return NextResponse.json({
      students,
      pagination: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
    });
  } catch (err: any) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: err.errors }, { status: 400 });
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const data = studentSchema.parse(body);

    const newStudent = await prisma.student.create({
      data: {
        userId: data.userId,
        schoolId: schoolAccount.schoolId,
        classId: data.classId,
        gradeId: data.gradeId,
        enrolledAt: data.enrolledAt ? new Date(data.enrolledAt) : undefined,
      },
      include: {
        user: true,
        class: true,
        grade: true,
      },
    });

    return NextResponse.json(newStudent, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: err.errors }, { status: 400 });
    return NextResponse.json({ error: err.message || "Failed to create student" }, { status: 500 });
  }
}
