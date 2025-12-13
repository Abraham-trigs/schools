// app/api/classes/[classId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db.ts";
import { SchoolAccount } from "@/lib/schoolAccount.ts";
import { z } from "zod";

const updateClassSchema = z.object({ name: z.string().min(1).optional() });

// Helper to add full name to a user
function addFullName(user: any) {
  return {
    ...user,
    fullName: [user.firstName, user.surname, user.otherNames].filter(Boolean).join(" "),
  };
}

// Helper to map full names in arrays
function addFullNameToArray(arr: any[]) {
  return arr.map((item) => ({
    ...item,
    user: item.user ? addFullName(item.user) : undefined,
  }));
}

export async function GET(req: NextRequest, context: { params: { classId: string } }) {
  try {
    const { classId } = context.params;
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const cls = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        grades: { select: { id: true, name: true } },
        staff: {
          select: {
            id: true,
            position: true,
            hireDate: true,
            user: { select: { id: true, firstName: true, surname: true, otherNames: true, email: true } },
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
            user: { select: { id: true, firstName: true, surname: true, otherNames: true, email: true } },
          },
        },
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

export async function PUT(req: NextRequest, context: { params: { classId: string } }) {
  try {
    const { classId } = context.params;
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const data = updateClassSchema.parse(body);

    const updatedClass = await prisma.class.update({
      where: { id: classId },
      data,
      include: { grades: true },
    });

    return NextResponse.json(updatedClass);
  } catch (err: any) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: err.errors }, { status: 400 });
    return NextResponse.json({ error: err.message || "Failed to update class" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: { params: { classId: string } }) {
  try {
    const { classId } = context.params;
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.class.delete({ where: { id: classId } });
    return NextResponse.json({ message: "Class deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete class" }, { status: 500 });
  }
}
