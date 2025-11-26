// app/api/exams/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { SchoolAccount } from "@/lib/schoolAccount";

// Zod schema for creating exams
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

// -------------------- GET Exams --------------------
export async function GET(req: NextRequest) {
  const schoolAccount = await SchoolAccount.init();
  if (!schoolAccount)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";
    const studentId = url.searchParams.get("studentId");
    const page = Number(url.searchParams.get("page") || 1);
    const limit = Number(url.searchParams.get("limit") || 20);
    const skip = (page - 1) * limit;

    const where: any = {
      student: { class: { schoolId: schoolAccount.schoolId } }, // school scoping
    };
    if (search) where.subject = { name: { contains: search, mode: "insensitive" } };
    if (studentId) where.studentId = studentId;

    const [exams, total] = await prisma.$transaction([
      prisma.exam.findMany({
        where,
        include: { student: { select: { id: true, name: true, email: true } }, subject: true },
        skip,
        take: limit,
        orderBy: { date: "desc" },
      }),
      prisma.exam.count({ where }),
    ]);

    return NextResponse.json({ data: exams, total, page, limit });
  } catch (err: any) {
    console.error("GET /api/exams error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// -------------------- POST Create Exam --------------------
export async function POST(req: NextRequest) {
  const schoolAccount = await SchoolAccount.init();
  if (!schoolAccount)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = ExamCreateSchema.parse(body);

    // Ensure the student belongs to the same school
    const student = await prisma.student.findFirst({
      where: { id: parsed.studentId, class: { schoolId: schoolAccount.schoolId } },
    });
    if (!student)
      return NextResponse.json({ message: "Student not found in your school" }, { status: 404 });

    const exam = await prisma.exam.create({
      data: parsed,
      include: { student: { select: { id: true, name: true, email: true } }, subject: true },
    });

    return NextResponse.json({ data: exam }, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: err.flatten() }, { status: 400 });

    console.error("POST /api/exams error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
