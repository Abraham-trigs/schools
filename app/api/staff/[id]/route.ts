// app/api/users/[id]/route.ts
// Purpose: User item API – retrieve, update, delete by ID (role only applied at Staff)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma.ts";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { cookieUser } from "@/lib/cookieUser.ts";
import { Role } from "@/lib/db.ts";

const userUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  busId: z.string().optional().nullable(),
});

// ------------------------- GET: Retrieve user -------------------------
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const authUser = await cookieUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findFirst({
    where: { id: params.id, schoolId: authUser.schoolId },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json(user);
}

// ------------------------- PUT: Update user -------------------------
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const authUser = await cookieUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (![Role.ADMIN, Role.PRINCIPAL].includes(authUser.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const data = userUpdateSchema.parse(body);

    if (data.email) {
      const exists = await prisma.user.findFirst({
        where: { email: data.email, id: { not: params.id } },
      });
      if (exists) return NextResponse.json({ error: { email: ["Email already exists"] } }, { status: 400 });
    }

    if (data.password) data.password = await bcrypt.hash(data.password, 10);

    const updated = await prisma.user.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.flatten() }, { status: 400 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ------------------------- DELETE: Remove user -------------------------
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const authUser = await cookieUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (![Role.ADMIN, Role.PRINCIPAL].includes(authUser.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await prisma.user.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
