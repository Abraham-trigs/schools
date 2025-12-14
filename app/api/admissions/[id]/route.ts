import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SchoolAccount } from "@/lib/schoolAccount.ts";
import { StepSchemas, updateAdmission } from "@/lib/helpers/admission.ts";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id: applicationId } = params;
    if (!applicationId) return NextResponse.json({ error: "Missing application id" }, { status: 400 });

    const schoolAccount = await SchoolAccount.init(req);
    if (!schoolAccount) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const stepIndex = body.step;
    if (typeof stepIndex !== "number" || !StepSchemas[stepIndex]) {
      return NextResponse.json({ error: "Invalid step" }, { status: 400 });
    }

    const validatedData = StepSchemas[stepIndex].parse(body);

    const updated = await prisma.$transaction((tx) =>
      updateAdmission(tx, applicationId, stepIndex, validatedData)
    );

    return NextResponse.json({ success: true, application: updated });
  } catch (err: any) {
    console.error("PATCH /admission/[id] error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
