// app/api/classes/[classId]/grades/[gradeId]/route.ts
// Purpose: PUT, DELETE single grade

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db.ts";
import { SchoolAccount } from "@/lib/schoolAccount.ts";
import { z } from "zod";

const gradeSchema = z.object({ name: z.string().min(1) });

export async function PUT(req: NextRequest, { params }: { params: { classId: string; gradeId: string } }) {
  try {
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const data = gradeSchema.parse(body);

    const updatedGrade = await prisma.grade.update({ where: { id: params.gradeId }, data });
    return NextResponse.json(updatedGrade);
  } catch (err: any) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 400 });
    return NextResponse.json({ error: err.message || "Failed to update grade" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { classId: string; gradeId: string } }) {
  try {
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.grade.delete({ where: { id: params.gradeId } });
    return NextResponse.json({ message: "Grade deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete grade" }, { status: 500 });
  }
}
