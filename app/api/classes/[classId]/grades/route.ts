// app/api/classes/[classId]/grades/route.ts
// Purpose: GET, POST grades for a class

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db.ts";
import { SchoolAccount } from "@/lib/schoolAccount.ts";
import { z } from "zod";

const gradeSchema = z.object({ name: z.string().min(1) });

export async function GET(req: NextRequest, { params }: { params: { classId: string } }) {
  try {
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const grades = await prisma.grade.findMany({ where: { classId: params.classId }, orderBy: { name: "asc" } });
    return NextResponse.json(grades);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { classId: string } }) {
  try {
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const data = gradeSchema.parse(body);

    const newGrade = await prisma.grade.create({ data: { name: data.name, classId: params.classId } });
    return NextResponse.json(newGrade, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 400 });
    return NextResponse.json({ error: err.message || "Failed to create grade" }, { status: 500 });
  }
}
