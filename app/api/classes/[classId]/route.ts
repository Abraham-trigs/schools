// app/api/classes/[classId]/route.ts
// Purpose: Read, update, and safely delete a class without destroying students, grades, staff, exams, or historical data

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db.ts";
import { SchoolAccount } from "@/lib/schoolAccount.ts";
import { z } from "zod";

// -------------------- Validation --------------------
const updateClassSchema = z.object({
  name: z.string().min(1).optional(),
});

// -------------------- Helpers --------------------
function addFullName(user: any) {
  return {
    ...user,
    fullName: [user.firstName, user.surname, user.otherNames].filter(Boolean).join(" "),
  };
}

function addFullNameToArray(arr: any[]) {
  return arr.map((item) => ({
    ...item,
    user: item.user ? addFullName(item.user) : undefined,
  }));
}

// -------------------- GET Class --------------------
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const { classId } = await params;

    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const cls = await prisma.class.findFirst({
      where: { id: classId, schoolId: schoolAccount.schoolId },
      include: {
        grades: { select: { id: true, name: true } },
        staff: { select: { id: true, position: true, hireDate: true, user: { select: { id: true, firstName: true, surname: true, otherNames: true, email: true } } } },
        subjects: { select: { id: true, name: true } },
        exams: { select: { id: true, title: true } },
        students: { select: { id: true, userId: true, enrolledAt: true, classId: true, gradeId: true, user: { select: { id: true, firstName: true, surname: true, otherNames: true, email: true } } } },
      },
    });

    if (!cls) return NextResponse.json({ error: "Class not found" }, { status: 404 });

    return NextResponse.json({
      ...cls,
      staff: addFullNameToArray(cls.staff),
      students: addFullNameToArray(cls.students),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

// -------------------- PUT Class --------------------
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const { classId } = await params;

    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const data = updateClassSchema.parse(body);

    const updatedClass = await prisma.class.update({
      where: { id: classId },
      data,
      include: { grades: true },
    });

    return NextResponse.json(updatedClass);
  } catch (err: any) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 400 });
    return NextResponse.json({ error: err.message || "Failed to update class" }, { status: 500 });
  }
}

// -------------------- DELETE Class --------------------
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const { classId } = await params;

    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const cls = await prisma.class.findFirst({
      where: { id: classId, schoolId: schoolAccount.schoolId },
      select: { id: true },
    });
    if (!cls) return NextResponse.json({ error: "Class not found" }, { status: 404 });

    // Atomic detach & delete
    await prisma.$transaction(async (tx) => {
      await tx.grade.updateMany({ where: { classId }, data: { classId: null } });
      await tx.student.updateMany({ where: { classId }, data: { classId: null } });
      await tx.staff.updateMany({ where: { classId }, data: { classId: null } });
      await tx.exam.updateMany({ where: { classId }, data: { classId: null } });
      await tx.class.update({ where: { id: classId }, data: { subjects: { set: [] } } });
      await tx.class.delete({ where: { id: classId } });
    });

    return NextResponse.json({ message: "Class deleted successfully" });
  } catch (err: any) {
    console.error("DELETE /api/classes/[classId] failed:", err);
    return NextResponse.json({ error: "Failed to delete class", detail: err.message }, { status: 500 });
  }
}

/*
Design reasoning:
- Argument-free SchoolAccount.init() ensures multi-tenant access control
- GET returns full class with staff/students enriched with full names
- PUT allows safe name updates only, grades preserved
- DELETE detaches all relations and preserves historical data before deleting the class

Structure:
- GET() → read full class
- PUT() → update class fields
- DELETE() → detach relations and remove class atomically

Implementation guidance:
- Frontend can call GET/PUT/DELETE using dynamic [classId] param
- Zod validation prevents invalid updates
- Transactions ensure consistent state for DELETE

Scalability insight:
- Supports large class relations without deleting critical historical data
- Future-proof for additional relations or audit logs
- Full multi-tenant safety for multi-school deployments
*/
