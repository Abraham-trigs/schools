// app/api/staff/[id]/route.ts
// Purpose: Safely update a staff member with nested user data, class, and department inference.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { cookieUser } from "@/lib/cookieUser.ts";
import { inferDepartmentFromPosition, requiresClass } from "@/lib/api/constants/roleInference";

// ------------------------- Schemas -------------------------
const staffUpdateSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  position: z.string().optional(),
  classId: z.string().optional().nullable(),
});

// ------------------------- PUT: Update staff -------------------------
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const currentUser = await cookieUser(req);
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = staffUpdateSchema.parse(body);

    const staff = await prisma.staff.findUnique({
      where: { id: params.id },
      include: { user: true },
    });
    if (!staff) return NextResponse.json({ error: "Staff not found" }, { status: 404 });

    const departmentName = data.position ? inferDepartmentFromPosition(data.position) : null;
    const department = departmentName
      ? await prisma.department.findUnique({ where: { name: departmentName } })
      : null;

    const updateData: any = {
      position: data.position ?? staff.position,
      departmentId: department?.id ?? null,
      classId: requiresClass(data.position) ? data.classId ?? null : null,
    };

    if (data.name || data.email) {
      await prisma.user.update({
        where: { id: staff.userId },
        data: { ...(data.name && { name: data.name }), ...(data.email && { email: data.email }) },
      });
    }

    const updated = await prisma.staff.update({
      where: { id: params.id },
      data: updateData,
      include: { user: true, class: true, department: true },
    });

    return NextResponse.json({ staff: updated });
  } catch (err: any) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: { message: "Validation failed", details: err.errors } }, { status: 400 });
    return NextResponse.json({ error: { message: err.message || "Internal Server Error" } }, { status: 500 });
  }
}

// ------------------------- DELETE: Remove staff -------------------------
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const currentUser = await cookieUser(req);
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await prisma.staff.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: { message: "Internal Server Error" } }, { status: 500 });
  }
}

/* Design reasoning:
- PUT validates incoming data, updates nested user and department, and ensures class assignment matches role.
- DELETE ensures secure removal of staff while returning a consistent success message.
Structure:
- PUT: update staff
- DELETE: delete staff
Implementation guidance:
- Wire these into a staff management page with edit/delete buttons and optimistic UI updates.
Scalability insight:
- Can extend PUT with audit logging or role-based restrictions without changing endpoint structure.
*/
