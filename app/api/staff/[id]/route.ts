// ---------------------------------------------
// app/api/staff/[id]/route.ts
// Purpose: Update or delete staff member safely, scoped by schoolId with subjects, class, and department updates
// ---------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { cookieUser } from "@/lib/cookieUser";
import { inferDepartmentFromPosition, requiresClass } from "@/lib/api/constants/roleInference.ts";

const staffUpdateSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  position: z.string().optional(),
  classId: z.string().nullable().optional(),
  subjects: z.array(z.string()).optional(),
});

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const currentUser = await cookieUser();
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = staffUpdateSchema.parse(body);

    const staff = await prisma.staff.findUnique({
      where: { id: params.id },
      include: { user: true, subjects: true },
    });
    if (!staff) return NextResponse.json({ error: "Staff not found" }, { status: 404 });

    if (staff.user.schoolId !== currentUser.schoolId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const departmentName = data.position ? inferDepartmentFromPosition(data.position) : null;
    const department = departmentName
      ? await prisma.department.findUnique({
          where: { name_schoolId: { name: departmentName, schoolId: currentUser.schoolId } },
        })
      : null;

    const updateData: any = {
      position: data.position ?? staff.position,
      departmentId: department?.id ?? null,
      classId: requiresClass(data.position) ? data.classId ?? null : null,
      subjects: data.subjects ? { set: data.subjects.map((id) => ({ id })) } : undefined,
    };

    const updated = await prisma.$transaction(async (tx) => {
      if (data.name || data.email) {
        await tx.user.update({
          where: { id: staff.userId },
          data: { ...(data.name && { name: data.name }), ...(data.email && { email: data.email }) },
        });
      }

      return tx.staff.update({
        where: { id: params.id },
        data: updateData,
        include: { user: true, class: true, department: true, subjects: true },
      });
    });

    return NextResponse.json({ staff: updated });
  } catch (err: any) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: { message: "Validation failed", details: err.errors } }, { status: 400 });
    return NextResponse.json({ error: { message: err.message || "Internal Server Error" } }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const currentUser = await cookieUser();
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const staff = await prisma.staff.findUnique({
    where: { id: params.id },
    include: { user: true },
  });
  if (!staff) return NextResponse.json({ error: "Staff not found" }, { status: 404 });

  if (staff.user.schoolId !== currentUser.schoolId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await prisma.staff.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: { message: "Internal Server Error" } }, { status: 500 });
  }
}
