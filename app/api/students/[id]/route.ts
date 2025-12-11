// ==========================================================
// File: app/api/students/[id]/route.ts
// RESTful: GET (single), PUT (update), DELETE (remove)
// ==========================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SchoolAccount } from "@/lib/schoolAccount.ts";
import { z } from "zod";

// ------------------ Authorization ------------------
async function authorize(req: NextRequest) {
  const schoolAccount = await SchoolAccount.init(req);
  if (!schoolAccount) return null;
  return schoolAccount;
}

// ------------------ GET /api/students/:id ------------------
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const schoolAccount = await authorize(req);
    if (!schoolAccount)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const student = await prisma.student.findUnique({
      where: { id: params.id },
      include: {
        user: true,
        Class: true,
        Grade: true,
        application: true,
        StudentAttendance: true,
        Exam: true,
        Parent: true,
        Borrow: true,
        Transaction: true,
        Purchase: true,
        subjects: true,
      },
    });

    if (!student || student.schoolId !== schoolAccount.schoolId)
      return NextResponse.json({ error: "Student not found" }, { status: 404 });

    return NextResponse.json({ student });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

// ------------------ PUT /api/students/:id ------------------
const updateStudentSchema = z.object({
  classId: z.string().uuid().nullable().optional(),
  gradeId: z.string().uuid().nullable().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const schoolAccount = await authorize(req);
    if (!schoolAccount)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const raw = await req.json();
    const parsed = updateStudentSchema.safeParse(raw);

    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

    const existing = await prisma.student.findFirst({
      where: { id: params.id, schoolId: schoolAccount.schoolId },
    });

    if (!existing)
      return NextResponse.json({ error: "Student not found" }, { status: 404 });

    const updated = await prisma.student.update({
      where: { id: params.id },
      data: {
        classId:
          parsed.data.classId === undefined ? existing.classId : parsed.data.classId,
        gradeId:
          parsed.data.gradeId === undefined ? existing.gradeId : parsed.data.gradeId,
      },
      include: {
        user: true,
        Class: true,
        Grade: true,
        application: true,
      },
    });

    return NextResponse.json({ student: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Update failed" }, { status: 400 });
  }
}

// ------------------ DELETE /api/students/:id ------------------
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const schoolAccount = await authorize(req);
    if (!schoolAccount)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const deleted = await prisma.student.deleteMany({
      where: { id: params.id, schoolId: schoolAccount.schoolId },
    });

    if (deleted.count === 0)
      return NextResponse.json(
        { error: "Student not found or not permitted" },
        { status: 404 }
      );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Delete failed" }, { status: 400 });
  }
}
