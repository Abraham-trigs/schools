// app/api/users/[id]/route.ts
// Purpose: CRUD for individual users with staff integration, school context, hashed passwords, and Zod validation.

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { userCreateSchema, staffRoles } from "@/lib/validation/userSchemas";
import { cookieUser } from "@/lib/cookieUser";
import { z } from "zod";
import bcrypt from "bcryptjs";

const paramsSchema = z.object({ id: z.string().uuid() });

// ------------------- Design reasoning -------------------
// - GET/PUT/DELETE scoped to school to prevent cross-school access.
// - PUT hashes password if updated and maintains busId logic.
// - If role changes to a staffRole, ensures Staff record exists or updates it.
// - Returns Staff info for frontend convenience.
// - Zod validates route params and request body.

// ------------------- Structure -------------------
// Exports:
// GET -> fetch user + staff info
// PUT -> update user + staff info
// DELETE -> remove user + associated staff

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = paramsSchema.parse(params);
    const currentUser = await cookieUser();
    if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findFirst({
      where: { id, schoolId: currentUser.school?.id },
      include: { staff: true },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json(user);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server error" }, { status: 400 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = paramsSchema.parse(params);
    const currentUser = await cookieUser();
    if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = userCreateSchema.partial().parse(body);

    if (parsed.password) parsed.password = await bcrypt.hash(parsed.password, 12);
    if (parsed.role && parsed.role !== "TRANSPORT") parsed.busId = null;
    if (parsed.role === "TRANSPORT" && !parsed.busId)
      return NextResponse.json({ error: "busId required for TRANSPORT role" }, { status: 400 });

    const updatedUser = await prisma.$transaction(async (tx) => {
      const userUpdate = await tx.user.updateMany({
        where: { id, schoolId: currentUser.school?.id },
        data: parsed,
      });

      // Staff handling
      if (parsed.role && staffRoles.includes(parsed.role)) {
        const staffExists = await tx.staff.findUnique({ where: { userId: id } });
        if (staffExists) {
          await tx.staff.update({
            where: { userId: id },
            data: { role: parsed.role },
          });
        } else {
          await tx.staff.create({
            data: { userId: id, role: parsed.role, schoolId: currentUser.school?.id },
          });
        }
      }

      return userUpdate;
    });

    const userWithStaff = await prisma.user.findUnique({
      where: { id },
      include: { staff: true },
    });

    return NextResponse.json(userWithStaff);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server error" }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = paramsSchema.parse(params);
    const currentUser = await cookieUser();
    if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.$transaction(async (tx) => {
      await tx.staff.deleteMany({ where: { userId: id } });
      await tx.user.deleteMany({ where: { id, schoolId: currentUser.school?.id } });
    });

    return NextResponse.json({ message: "User and associated staff deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server error" }, { status: 400 });
  }
}
