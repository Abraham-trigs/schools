// app/api/students/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SchoolAccount } from "@/lib/schoolAccount";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const studentId = params.id;
    if (!studentId) return NextResponse.json({ error: "Student ID is required" }, { status: 400 });

    // Fetch student and all relations
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: true,
        class: true,
        application: {
          include: {
            previousSchools: true,
            familyMembers: true,
            admissionPayment: true,
          },
        },
        exams: true,
        StudentAttendance: true,
        Borrow: { include: { book: true } },
        Transaction: true,
        Purchase: { include: { resource: true } },
      },
    });

    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

    // Enforce school scoping
    if (student.schoolId !== schoolAccount.schoolId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({ student }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
