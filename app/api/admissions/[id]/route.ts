import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SchoolAccount } from "@/lib/schoolAccount";
import { StepSchemas, updateAdmission } from "@/lib/helpers/admission.ts";

async function authorize() {
  const account = await SchoolAccount.init();
  if (!account) throw new Error("Unauthorized");
  return account;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id: applicationId } = params;
    if (!applicationId) return NextResponse.json({ error: "Missing application id" }, { status: 400 });

    const body = await req.json();
    const step = body.step;
    if (typeof step !== "number" || !StepSchemas[step]) return NextResponse.json({ error: "Invalid step" }, { status: 400 });

    const parsed = StepSchemas[step].safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors.map((e) => ({ path: e.path.join("."), message: e.message })) }, { status: 400 });

    await authorize();

    const updated = await prisma.$transaction((tx) => updateAdmission(tx, applicationId, step, parsed.data));
    return NextResponse.json({ success: true, application: updated });
  } catch (err: any) {
    console.error("PATCH /admission/[id] error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
