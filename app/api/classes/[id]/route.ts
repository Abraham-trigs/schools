// app/api/classes/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SchoolAccount } from "@/lib/schoolAccount";
import { z } from "zod";

const classUpdateSchema = z.object({
  name: z.string().optional(),
});

// -------------------- GET Class by ID --------------------
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const schoolAccount = await SchoolAccount.init();
  if (!schoolAccount)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const cls = await prisma.class.findFirst({
    where: { id: params.id, schoolId: schoolAccount.schoolId },
    include: {
      students: {
        include: {
          user: { select: { id: true, name: true, email: true } }, // Include user info
        },
      },
    },
  });

  if (!cls)
    return NextResponse.json({ message: "Class not found" }, { status: 404 });

  return NextResponse.json(cls);
}

// -------------------- PUT Update Class --------------------
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const schoolAccount = await SchoolAccount.init();
  if (!schoolAccount)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = classUpdateSchema.parse(body);

    const updatedClass = await prisma.class.updateMany({
      where: { id: params.id, schoolId: schoolAccount.schoolId },
      data: { name: data.name ?? undefined },
    });

    if (updatedClass.count === 0) {
      return NextResponse.json({ message: "Class not found or unauthorized" }, { status: 404 });
    }

    // Fetch the updated record to return
    const cls = await prisma.class.findFirst({
      where: { id: params.id, schoolId: schoolAccount.schoolId },
    });

    return NextResponse.json(cls);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Failed to update class" },
      { status: 400 }
    );
  }
}

// -------------------- DELETE Class --------------------
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const schoolAccount = await SchoolAccount.init();
  if (!schoolAccount)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const cls = await prisma.class.findFirst({
      where: { id: params.id, schoolId: schoolAccount.schoolId },
      include: { students: true },
    });

    if (!cls)
      return NextResponse.json({ message: "Class not found" }, { status: 404 });

    if (cls.students.length > 0) {
      return NextResponse.json(
        { message: "Cannot delete class while students are enrolled" },
        { status: 400 }
      );
    }

    await prisma.class.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Class deleted successfully" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Failed to delete class" },
      { status: 400 }
    );
  }
}
