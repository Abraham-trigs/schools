// app/api/staff/[id]/route.ts
// Purpose: Safely update a staff member with nested user data, class, and department inference.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { cookieUser } from "@/lib/cookieUser";
import {
  inferDepartmentFromPosition,
  requiresClass,
} from "@/lib/api/constants/roleInference";

const staffUpdateSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  position: z.string().optional(),
  classId: z.string().optional().nullable(),
});

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const currentUser = await cookieUser(req);
  if (!currentUser)
    return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });

  try {
    const body = await req.json();
    const data = staffUpdateSchema.parse(body);

    // Fetch staff record first (to ensure valid user relation)
    const staff = await prisma.staff.findUnique({
      where: { id: params.id },
      include: { user: true },
    });

    if (!staff)
      return NextResponse.json({ error: { message: "Staff not found" } }, { status: 404 });

    // Determine department by position
    const departmentName = data.position
      ? inferDepartmentFromPosition(data.position)
      : null;

    const department = departmentName
      ? await prisma.department.findUnique({ where: { name: departmentName } })
      : null;

    // Build update payload safely
    const updateData: any = {
      position: data.position ?? staff.position,
      departmentId: department?.id ?? null,
      classId: requiresClass(data.position) ? data.classId ?? null : null,
    };

    // Update nested user record if provided
    if (data.name || data.email) {
      await prisma.user.update({
        where: { id: staff.userId },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.email && { email: data.email }),
        },
      });
    }

    const updated = await prisma.staff.update({
      where: { id: params.id },
      data: updateData,
      include: { user: true, class: true, department: true },
    });

    return NextResponse.json({ staff: updated });
  } catch (error: any) {
    console.error("❌ Staff update failed:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: { message: "Validation failed", details: error.errors } }, { status: 400 });
    }
    return NextResponse.json({ error: { message: error.message || "Internal Server Error" } }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const currentUser = await cookieUser(req);
  if (!currentUser)
    return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });

  try {
    await prisma.staff.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("❌ Staff delete failed:", error);
    return NextResponse.json({ error: { message: "Internal Server Error" } }, { status: 500 });
  }
}
