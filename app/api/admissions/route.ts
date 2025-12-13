import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SchoolAccount } from "@/lib/schoolAccount";
import { StepSchemas, updateAdmission } from "@/lib/helpers/admission.ts";

async function authorize(req: NextRequest) {
  const schoolAccount = await SchoolAccount.init(req);
  if (!schoolAccount) throw new Error("Unauthorized");
  return schoolAccount;
}

export async function POST(req: NextRequest) {
  try {
    const schoolAccount = await authorize(req);
    const body = await req.json();
    const stepIndex = body.step ?? 0;

    if (!StepSchemas[stepIndex]) return NextResponse.json({ error: "Invalid step" }, { status: 400 });

    const validatedData = StepSchemas[stepIndex].parse(body);

    const admission = await prisma.$transaction(async (tx) => {
      let userId: string;
      let applicationId: string;

      if (stepIndex === 0) {
        // Step 0: Create User & Student
        const user = await tx.user.create({ data: { ...validatedData, role: "STUDENT", schoolId: schoolAccount.schoolId } });
        userId = user.id;

        const student = await tx.student.create({ data: { userId, schoolId: schoolAccount.schoolId, enrolledAt: new Date() } });
        const app = await tx.application.create({ data: { userId, studentId: student.id, schoolId: schoolAccount.schoolId, status: "DRAFT", progress: 0 } });
        applicationId = app.id;
      } else {
        // Later steps: Find existing application by email
        const app = await tx.application.findFirst({ where: { user: { email: body.email } } });
        if (!app) throw new Error("Application not found");
        applicationId = app.id;
      }

      // Use unified update function for all steps > 0
      if (stepIndex > 0) return updateAdmission(tx, applicationId, stepIndex, validatedData);

      return tx.application.findUnique({ where: { id: applicationId } });
    });

    return NextResponse.json({ success: true, admission }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
