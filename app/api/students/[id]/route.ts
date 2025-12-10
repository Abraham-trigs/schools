// app/api/students/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SchoolAccount } from "@/lib/schoolAccount";
import { z } from "zod";

const updateStudentSchema = z.object({
  classId: z.string().optional(),
  gradeId: z.string().optional(),
  enrolledAt: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const student = await prisma.student.findUnique({
      where: { id: params.id },
      include: {
        user: true,
        school: true,
        Class: true,
        Grade: true,
        subjects: true,
        application: {
          include: {
            previousSchools: true,
            familyMembers: true,
            admissionPayment: true,
          },
        },
        Exam: true,
        StudentAttendance: true,
        Parent: true,
        Borrow: { include: { book: true } },
        Transaction: true,
        Purchase: { include: { resource: true } },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    if (student.schoolId !== schoolAccount.schoolId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({ student });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data = updateStudentSchema.parse(body);

    const updatedStudent = await prisma.student.update({
      where: { id: params.id },
      data: {
        classId: data.classId,
        gradeId: data.gradeId,
        enrolledAt: data.enrolledAt ? new Date(data.enrolledAt) : undefined,
      },
      include: {
        user: true,
        Class: true,
        Grade: true,
      },
    });

    return NextResponse.json(updatedStudent);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }

    return NextResponse.json(
      { error: err.message || "Failed to update student" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.student.delete({ where: { id: params.id } });

    return NextResponse.json({ message: "Student deleted successfully" });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to delete student" },
      { status: 500 }
    );
  }
}
