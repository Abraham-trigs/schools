// app/api/staff/[id]/route.ts
// Purpose: Update or delete a staff member securely, supporting multiple subjects, enforcing school scoping, nested user updates, and department inference.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { cookieUser } from "@/lib/cookieUser";
import { inferDepartmentFromPosition, requiresClass } from "@/lib/api/constants/roleInference.ts";

// ------------------------- Schemas -------------------------
const staffUpdateSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  position: z.string().optional(),
  classId: z.string().nullable().optional(),
  subjects: z.array(z.string()).optional(),
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
      include: { user: true, subjects: true },
    });
    if (!staff) return NextResponse.json({ error: "Staff not found" }, { status: 404 });

    if (staff.user.schoolId !== currentUser.school.id)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const departmentName = data.position ? inferDepartmentFromPosition(data.position) : null;
    const department = departmentName
      ? await prisma.department.findUnique({ where: { name: departmentName } })
      : null;

    const updateData: any = {
      position: data.position ?? staff.position,
      departmentId: department?.id ?? null,
      classId: requiresClass(data.position) ? data.classId ?? null : null,
    };

    if (data.subjects) {
      updateData.subjects = { set: data.subjects.map((id) => ({ id })) };
    }

    if (data.name || data.email) {
      await prisma.user.update({
        where: { id: staff.userId },
        data: { ...(data.name && { name: data.name }), ...(data.email && { email: data.email }) },
      });
    }

    const updated = await prisma.staff.update({
      where: { id: params.id },
      data: updateData,
      include: { user: true, class: true, department: true, subjects: true },
    });

    return NextResponse.json({ staff: updated });
  } catch (err: any) {
    if (err instanceof z.ZodError)
      return NextResponse.json(
        { error: { message: "Validation failed", details: err.errors } },
        { status: 400 }
      );
    return NextResponse.json({ error: { message: err.message || "Internal Server Error" } }, { status: 500 });
  }
}

// ------------------------- DELETE: Remove staff -------------------------
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const currentUser = await cookieUser(req);
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const staff = await prisma.staff.findUnique({
    where: { id: params.id },
    include: { user: true },
  });
  if (!staff) return NextResponse.json({ error: "Staff not found" }, { status: 404 });

  if (staff.user.schoolId !== currentUser.school.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await prisma.staff.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: { message: "Internal Server Error" } }, { status: 500 });
  }
}

/* Design reasoning:
- PUT now supports updating multiple subjects via Prisma many-to-many set.
- DELETE ensures school scoping and prevents cross-school deletion.
Structure:
- PUT: Update staff with nested user and subjects.
- DELETE: Remove staff safely.
Implementation guidance:
- Front-end must send subjects as array of IDs for create/update.
- Optimistic UI updates possible via useStaffStore.
Scalability insight:
- Adding additional relations or roles can be achieved without modifying core CRUD logic.
*/
