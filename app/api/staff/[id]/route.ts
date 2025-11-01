import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { cookieUser } from "@/lib/helpers/cookieUser";
import {
  inferRoleFromPosition,
  inferDepartmentFromPosition,
} from "@/lib/api/constants/roleInference";

const staffUpdateSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  position: z.string().optional(),
  classId: z.string().optional(),
});

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const currentUser = await cookieUser(req);
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = staffUpdateSchema.parse(body);
    const role = inferRoleFromPosition(data.position);
    const department = inferDepartmentFromPosition(data.position);

    const updated = await prisma.staff.update({
      where: { id: params.id },
      data: {
        position: data.position,
        role,
        department,
        classId: data.classId || null,
        user: {
          update: {
            name: data.name,
            email: data.email,
          },
        },
      },
      include: { user: true, class: true },
    });

    return NextResponse.json({ staff: updated });
  } catch (error) {
    console.error(error);
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: error.errors }, { status: 400 });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const currentUser = await cookieUser(req);
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await prisma.staff.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
