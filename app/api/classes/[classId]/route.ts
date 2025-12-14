// app/api/classes/[classId]/route.ts
// Purpose: Read, update, and safely delete a class without destroying
// students, grades, staff, exams, or historical data.
// Compatible with Next.js 15 dynamic params.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db.ts";
import { SchoolAccount } from "@/lib/schoolAccount.ts";
import { z } from "zod";

/* ---------------------------------
 * Validation
 * --------------------------------- */
const updateClassSchema = z.object({
  name: z.string().min(1).optional(),
});

/* ---------------------------------
 * Helpers
 * --------------------------------- */
function addFullName(user: any) {
  return {
    ...user,
    fullName: [user.firstName, user.surname, user.otherNames]
      .filter(Boolean)
      .join(" "),
  };
}

function addFullNameToArray(arr: any[]) {
  return arr.map((item) => ({
    ...item,
    user: item.user ? addFullName(item.user) : undefined,
  }));
}

/* ---------------------------------
 * GET /api/classes/[classId]
 * --------------------------------- */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const { classId } = await params;

    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cls = await prisma.class.findFirst({
      where: {
        id: classId,
        schoolId: schoolAccount.schoolId,
      },
      include: {
        grades: { select: { id: true, name: true } },
        staff: {
          select: {
            id: true,
            position: true,
            hireDate: true,
            user: {
              select: {
                id: true,
                firstName: true,
                surname: true,
                otherNames: true,
                email: true,
              },
            },
          },
        },
        subjects: { select: { id: true, name: true } },
        exams: { select: { id: true, title: true } },
        students: {
          select: {
            id: true,
            userId: true,
            enrolledAt: true,
            classId: true,
            gradeId: true,
            user: {
              select: {
                id: true,
                firstName: true,
                surname: true,
                otherNames: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!cls) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...cls,
      staff: addFullNameToArray(cls.staff),
      students: addFullNameToArray(cls.students),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}

/* ---------------------------------
 * PUT /api/classes/[classId]
 * --------------------------------- */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const { classId } = await params;

    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data = updateClassSchema.parse(body);

    const updatedClass = await prisma.class.update({
      where: { id: classId },
      data,
      include: { grades: true },
    });

    return NextResponse.json(updatedClass);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }

    return NextResponse.json(
      { error: err.message || "Failed to update class" },
      { status: 500 }
    );
  }
}

/* ---------------------------------
 * DELETE /api/classes/[classId]
 * --------------------------------- */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const { classId } = await params;

    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure ownership
    const cls = await prisma.class.findFirst({
      where: {
        id: classId,
        schoolId: schoolAccount.schoolId,
      },
      select: { id: true },
    });

    if (!cls) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Atomic operation: detach → delete
await prisma.$transaction(async (tx) => {
  // Grades survive
  await tx.grade.updateMany({
    where: { classId },
    data: { classId: null },
  });

  // Students survive
  await tx.student.updateMany({
    where: { classId },
    data: { classId: null },
  });

  // Staff survive
  await tx.staff.updateMany({
    where: { classId },
    data: { classId: null },
  });

  // Exams remain historical
  await tx.exam.updateMany({
    where: { classId },
    data: { classId: null },
  });

  // ✅ Correct way to clear many-to-many subjects
  await tx.class.update({
    where: { id: classId },
    data: {
      subjects: { set: [] },
    },
  });

  // Finally delete the class
  await tx.class.delete({
    where: { id: classId },
  });
});

    return NextResponse.json({ message: "Class deleted successfully" });
  } catch (err: any) {
    console.error("DELETE /api/classes/[classId] failed:", err);

    return NextResponse.json(
      { error: "Failed to delete class", detail: err.message },
      { status: 500 }
    );
  }
}
