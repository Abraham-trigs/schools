import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cookieUser } from "@/lib/cookieUser";
import { z } from "zod";

const classUpdateSchema = z.object({
  name: z.string().optional(),
});

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await cookieUser(req);
  if (!user)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const cls = await prisma.class.findUnique({
    where: { id: params.id },
    include: {
      students: {
        include: {
          user: true, // Include user info for each student
        },
      },
    },
  });

  if (!cls)
    return NextResponse.json({ message: "Class not found" }, { status: 404 });

  return NextResponse.json(cls);
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await cookieUser(req);
  if (!user)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = classUpdateSchema.parse(body);

    const updatedClass = await prisma.class.update({
      where: { id: params.id },
      data: { name: data.name ?? undefined },
    });

    return NextResponse.json(updatedClass);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Failed to update class" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await cookieUser(req);
  if (!user)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    // Use the correct relation 'students'
    const cls = await prisma.class.findUnique({
      where: { id: params.id },
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
    return NextResponse.json(
      { message: "Class deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Failed to delete class" },
      { status: 400 }
    );
  }
}
