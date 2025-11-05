// app/api/library/staff/[id]/route.ts
// Handles update/delete of LibraryStaff with validation, auth, and department control

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { cookieUser } from "@/lib/cookieUser.ts";

const updateSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  position: z.string().optional(),
  departmentId: z.string().optional().nullable(),
});

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const user = await cookieUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = updateSchema.parse(body);

    const staff = await prisma.libraryStaff.findUnique({ where: { id: params.id }, include: { user: true } });
    if (!staff) return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    if (staff.user.schoolId !== user.schoolId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    if (data.name || data.email) {
      await prisma.user.update({ where: { id: staff.userId }, data: { ...(data.name && { name: data.name }), ...(data.email && { email: data.email }) } });
    }

    const updated = await prisma.libraryStaff.update({
      where: { id: params.id },
      data: { position: data.position ?? staff.position, departmentId: data.departmentId ?? staff.departmentId },
      include: { user: true, department: true },
    });

    return NextResponse.json({ staff: updated });
  } catch (err: any) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: { message: "Validation failed", details: err.errors } }, { status: 400 });
    return NextResponse.json({ error: { message: err.message || "Internal Server Error" } }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = await cookieUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const staff = await prisma.libraryStaff.findUnique({ where: { id: params.id }, include: { user: true } });
    if (!staff) return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    if (staff.user.schoolId !== user.schoolId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.libraryStaff.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}
