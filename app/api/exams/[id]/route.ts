// app/api/exams/[id]/route.ts
// Purpose: Fetch, update, or delete a single exam scoped to authenticated school

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db.ts";
import { z } from "zod";
import { SchoolAccount } from "@/lib/schoolAccount.ts";
import { Role } from "@prisma/client";

// -------------------- Schemas --------------------
const ExamUpdateSchema = z.object({
  subjectId: z.string().cuid().optional(),
  score: z.preprocess((val) => (val !== undefined ? parseFloat(val as string) : undefined), z.number().optional()),
  maxScore: z.preprocess((val) => (val !== undefined ? parseFloat(val as string) : undefined), z.number().optional()),
  date: z.preprocess((val) => (val ? new Date(val as string) : undefined), z.date().optional()),
});

// -------------------- Helpers --------------------
const canModifyExam = (role: Role) => ["TEACHER", "ASSISTANT_TEACHER", "EXAM_OFFICER"].includes(role);

// -------------------- GET /:id --------------------
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const exam = await prisma.exam.findUnique({
      where: { id: params.id },
      include: { student: true, subject: true },
    });

    if (!exam || exam.student.schoolId !== schoolAccount.schoolId)
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });

    return NextResponse.json({ data: exam });
  } catch (err: any) {
    console.error("GET /api/exams/:id error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}

// -------------------- PUT /:id --------------------
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canModifyExam(schoolAccount.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const parsed = ExamUpdateSchema.parse(body);

    const updated = await prisma.$transaction(async (tx) => {
      const exam = await tx.exam.findUnique({
        where: { id: params.id },
        include: { student: true, subject: true },
      });

      if (!exam || exam.student.schoolId !== schoolAccount.schoolId)
        throw new Error("Exam not found or does not belong to your school");

      return tx.exam.update({
        where: { id: params.id },
        data: parsed,
        include: { student: true, subject: true },
      });
    });

    return NextResponse.json({ data: updated });
  } catch (err: any) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.flatten() }, { status: 400 });

    console.error("PUT /api/exams/:id error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}

// -------------------- DELETE /:id --------------------
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canModifyExam(schoolAccount.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const exam = await prisma.exam.findUnique({
      where: { id: params.id },
      include: { student: true },
    });

    if (!exam || exam.student.schoolId !== schoolAccount.schoolId)
      return NextResponse.json({ error: "Exam not found or not in your school" }, { status: 404 });

    await prisma.exam.delete({ where: { id: params.id } });

    return NextResponse.json({ data: { id: params.id, deleted: true } });
  } catch (err: any) {
    console.error("DELETE /api/exams/:id error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}

/*
Design reasoning:
- All exam operations scoped to authenticated school via argument-free SchoolAccount.init()
- PUT and DELETE restricted to authorized roles (TEACHER, ASSISTANT_TEACHER, EXAM_OFFICER)
- PUT uses transaction to prevent cross-school updates
- Zod validation ensures type safety and input normalization

Structure:
- GET → fetch single exam with student and subject
- PUT → update exam safely, transactional
- DELETE → remove exam if user authorized and school-scoped

Implementation guidance:
- Frontend can safely query, update, or delete exams with role checks
- Returns consistent error shapes: 401, 403, 404, 400, 500

Scalability insight:
- Adding new roles or exam fields only requires schema updates
- Multi-tenant safe; supports future audit logs or history tracking
*/
