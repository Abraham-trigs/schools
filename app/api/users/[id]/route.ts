// Purpose: CRUD for individual users with school scoping and staff/student relations
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SchoolAccount } from "@/lib/schoolAccount";
import { z } from "zod";
import bcrypt from "bcryptjs";

// ------------------- Zod Schemas -------------------
const paramsSchema = z.object({ id: z.string() });
const updateUserSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.string().optional(),
});

// ------------------- GET: Single User -------------------
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { id } = paramsSchema.parse(params);
  const schoolAcc = await SchoolAccount.init();
  if (!schoolAcc) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findFirst({
    where: { id, schoolId: schoolAcc.schoolId },
    include: { student: true, staff: true, school: true },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json(user);
}

// ------------------- PUT: Update User -------------------
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { id } = paramsSchema.parse(params);
  const schoolAcc = await SchoolAccount.init();
  if (!schoolAcc) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = updateUserSchema.parse(body);

    if (parsed.password) parsed.password = await bcrypt.hash(parsed.password, 12);

    await prisma.user.updateMany({
      where: { id, schoolId: schoolAcc.schoolId },
      data: parsed,
    });

    const user = await prisma.user.findUnique({
      where: { id },
      include: { student: true, staff: true, school: true },
    });

    return NextResponse.json(user);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update user" }, { status: 400 });
  }
}

// ------------------- DELETE: Remove User -------------------
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { id } = paramsSchema.parse(params);
  const schoolAcc = await SchoolAccount.init();
  if (!schoolAcc) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.$transaction([
    prisma.staff.deleteMany({ where: { userId: id } }),
    prisma.user.deleteMany({ where: { id, schoolId: schoolAcc.schoolId } }),
  ]);

  return NextResponse.json({ message: "User and related staff/student deleted successfully" });
}
