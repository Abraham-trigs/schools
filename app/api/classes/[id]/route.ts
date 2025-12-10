// app/api/classes/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db.ts";
import { SchoolAccount } from "@/lib/schoolAccount.ts";
import { z } from "zod";

// -------------------- Schemas --------------------
const updateClassSchema = z.object({
  name: z.string().min(1, "Class name is required").optional(),
});

// -------------------- GET Single Class --------------------
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const cls = await prisma.class.findUnique({
      where: { id: params.id },
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
            user: { select: { id: true, firstName: true, surname: true, otherNames: true, email: true } },
          },
        },
      },
    });

    if (!cls) return NextResponse.json({ error: "Class not found" }, { status: 404 });

    // Add fullName for staff and students
    const clsWithFullNames = {
      ...cls,
      staff: cls.staff.map((st) => ({
        ...st,
        user: {
          ...st.user,
          fullName: [st.user.firstName, st.user.surname, st.user.otherNames].filter(Boolean).join(" "),
        },
      })),
      students: cls.students.map((s) => ({
        ...s,
        user: {
          ...s.user,
          fullName: [s.user.firstName, s.user.surname, s.user.otherNames].filter(Boolean).join(" "),
        },
      })),
    };

    return NextResponse.json(clsWithFullNames);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

// -------------------- PUT Update Class --------------------
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const data = updateClassSchema.parse(body);

    const updatedClass = await prisma.class.update({
      where: { id: params.id },
      data,
      include: { grades: true },
    });

    return NextResponse.json(updatedClass);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: err.message || "Failed to update class" }, { status: 500 });
  }
}

// -------------------- DELETE Class --------------------
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.class.delete({ where: { id: params.id } });

    return NextResponse.json({ message: "Class deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete class" }, { status: 500 });
  }
}
