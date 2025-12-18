import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db.ts";
import { z } from "zod";
import { SchoolAccount } from "@/lib/schoolAccount.ts";
import { Role } from "@prisma/client";

// Zod schema for updating exams
const ExamUpdateSchema = z.object({
  subjectId: z.string().cuid().optional(),
  score: z.preprocess((val) => (val !== undefined ? parseFloat(val as string) : undefined), z.number().optional()),
  maxScore: z.preprocess((val) => (val !== undefined ? parseFloat(val as string) : undefined), z.number().optional()),
  date: z.preprocess((val) => (val ? new Date(val as string) : undefined), z.date().optional()),
});

// Helper: check if user can modify exams
const canModifyExam = (role: Role) => ["TEACHER", "ASSISTANT_TEACHER", "EXAM_OFFICER"].includes(role);

// -------------------- GET single exam --------------------
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const exam = await prisma.exam.findUnique({
      where: { id: params.id },
      include: { student: true, subject: true },
    });

    if (!exam || exam.student.schoolId !== schoolAccount.schoolId) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    return NextResponse.json({ data: exam });
  } catch (err: any) {
    console.error("GET /api/exams/:id error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

// -------------------- PUT update exam --------------------
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userRole = schoolAccount.role;
    if (!canModifyExam(userRole)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const parsed = ExamUpdateSchema.parse(body);

    const exam = await prisma.exam.update({
      where: { id: params.id },
      data: parsed,
      include: { student: true, subject: true },
    });

    if (exam.student.schoolId !== schoolAccount.schoolId) {
      return NextResponse.json({ error: "Exam does not belong to your school" }, { status: 403 });
    }

    return NextResponse.json({ data: exam });
  } catch (err: any) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.flatten() }, { status: 400 });
    console.error("PUT /api/exams/:id error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

// -------------------- DELETE exam --------------------
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userRole = schoolAccount.role;
    if (!canModifyExam(userRole)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const exam = await prisma.exam.findUnique({ where: { id: params.id }, include: { student: true } });
    if (!exam || exam.student.schoolId !== schoolAccount.schoolId) {
      return NextResponse.json({ error: "Exam not found or not in your school" }, { status: 404 });
    }

    await prisma.exam.delete({ where: { id: params.id } });
    return NextResponse.json({ data: { id: params.id, deleted: true } });
  } catch (err: any) {
    console.error("DELETE /api/exams/:id error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
