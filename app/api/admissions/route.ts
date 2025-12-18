import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db.ts";
import { SchoolAccount } from "@/lib/schoolAccount.ts";
import { StepSchemas } from "@/lib/helpers/admission.ts";

export async function POST(req: NextRequest) {
  try {
    const schoolAccount = await SchoolAccount.init(req);
    if (!schoolAccount) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const stepIndex = body.step ?? 0;

    if (stepIndex !== 0) {
      return NextResponse.json({ error: "POST is only allowed for Step 0" }, { status: 400 });
    }

    const validatedData = StepSchemas[0].parse(body);

    const admission = await prisma.$transaction(async (tx) => {
      // Step 0: create user, student, and application
      const user = await tx.user.create({
        data: { ...validatedData, role: "STUDENT", schoolId: schoolAccount.schoolId },
      });

      const student = await tx.student.create({
        data: { userId: user.id, schoolId: schoolAccount.schoolId, enrolledAt: new Date() },
      });

      const app = await tx.application.create({
        data: {
          userId: user.id,
          studentId: student.id,
          schoolId: schoolAccount.schoolId,
          status: "DRAFT",
          progress: 0,
        },
      });

      return tx.application.findUnique({ where: { id: app.id } });
    });

    return NextResponse.json({ success: true, admission }, { status: 201 });
  } catch (err: any) {
    console.error("POST /admissions error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
