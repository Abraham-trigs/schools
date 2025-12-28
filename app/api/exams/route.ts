// app/api/exams/route.ts
// Purpose: List, search, paginate, and create exams scoped to authenticated school

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db.ts";
import { z } from "zod";
import { SchoolAccount } from "@/lib/schoolAccount.ts";

// -------------------- Schemas --------------------
const ExamCreateSchema = z.object({
  studentId: z.string().cuid(),
  subjectId: z.string().cuid(),
  score: z.preprocess((val) => parseFloat(val as string), z.number()),
  maxScore: z.preprocess((val) => parseFloat(val as string), z.number()),
  date: z.preprocess(
    (val) => (val ? new Date(val as string) : undefined),
    z.date().optional()
  ),
});

const QuerySchema = z.object({
  page: z.preprocess((val) => Number(val ?? 1), z.number().min(1)),
  perPage: z.preprocess((val) => Number(val ?? 20), z.number().min(1)),
  search: z.string().optional(),
  studentId: z.string().optional(),
});

// -------------------- GET exams --------------------
export async function GET(req: NextRequest) {
  try {
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const query = QuerySchema.parse(Object.fromEntries(new URL(req.url).searchParams.entries()));
    const skip = (query.page - 1) * query.perPage;

    const where: Parameters<typeof prisma.exam.findMany>[0]["where"] = {
      student: { schoolId: schoolAccount.schoolId },
      ...(query.search ? { subject: { name: { contains: query.search, mode: "insensitive" } } } : {}),
      ...(query.studentId ? { studentId: query.studentId } : {}),
    };

    const [exams, total] = await prisma.$transaction([
      prisma.exam.findMany({
        where,
        include: { student: true, subject: true },
        skip,
        take: query.perPage,
        orderBy: { date: "desc" },
      }),
      prisma.exam.count({ where }),
    ]);

    return NextResponse.json({ data: exams, total, page: query.page, perPage: query.perPage });
  } catch (err: any) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: err.flatten() }, { status: 400 });

    console.error("GET /api/exams error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}

// -------------------- POST create exam --------------------
export async function POST(req: NextRequest) {
  try {
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = ExamCreateSchema.parse(body);

    // Ensure student belongs to authenticated school
    const student = await prisma.student.findUnique({
      where: { id: parsed.studentId },
      select: { schoolId: true },
    });

    if (!student || student.schoolId !== schoolAccount.schoolId)
      return NextResponse.json({ error: "Student not found in your school" }, { status: 404 });

    const exam = await prisma.exam.create({
      data: parsed,
      include: { student: true, subject: true },
    });

    return NextResponse.json({ data: exam }, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: err.flatten() }, { status: 400 });

    console.error("POST /api/exams error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}

/*
Design reasoning:
- Fully scoped to authenticated school via argument-free SchoolAccount.init()
- GET supports search, pagination, student filtering, and consistent DTO
- POST validates input and ensures student belongs to the school

Structure:
- GET → paginated exam list with filters
- POST → create a new exam with validation

Implementation guidance:
- Use ?page=&perPage=&search=&studentId= on frontend
- Returns 401, 400, 404, and 500 consistently

Scalability insight:
- Can add filters (subjectId, date ranges, grade) without changing core logic
- $transaction ensures count + fetch consistency in GET
- Schema-driven validation reduces risk of invalid exam creation
*/
