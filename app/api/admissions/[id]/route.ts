// app/api/admissions/[id]/route.ts
// Purpose: Handle fetch, step-by-step updates, and deletion of an admission application

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db.ts";
import { z } from "zod";
import { SchoolAccount } from "@/lib/schoolAccount.ts";
import { StepSchemas, calculateProgress } from "@/lib/helpers/admission.ts";

/* -------------------------------------------------------------------------- */
/*                                GET /:id                                    */
/* -------------------------------------------------------------------------- */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const schoolAccount = await SchoolAccount.init(req);
    if (!schoolAccount)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const application = await prisma.application.findFirst({
      where: {
        id: params.id,
        schoolId: schoolAccount.schoolId,
      },
      include: {
        student: true,
        user: true,
      },
    });

    if (!application)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ application }, { status: 200 });
  } catch (err: any) {
    console.error("GET /admissions/:id error:", err);
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------------------------------- */
/*                                PUT /:id                                    */
/* -------------------------------------------------------------------------- */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const schoolAccount = await SchoolAccount.init(req);
    if (!schoolAccount)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const stepIndex = body.step;

    if (typeof stepIndex !== "number" || !StepSchemas[stepIndex]) {
      return NextResponse.json(
        { error: "Invalid or missing step index" },
        { status: 400 }
      );
    }

    if (stepIndex === 0) {
      return NextResponse.json(
        { error: "Step 0 updates are not allowed here" },
        { status: 400 }
      );
    }

    const validated = StepSchemas[stepIndex].parse(body);

    const updated = await prisma.$transaction(async (tx) => {
      const existing = await tx.application.findFirst({
        where: {
          id: params.id,
          schoolId: schoolAccount.schoolId,
        },
      });

      if (!existing) throw new Error("Application not found");

      const app = await tx.application.update({
        where: { id: params.id },
        data: {
          ...validated,
          progress: calculateProgress({
            ...existing,
            ...validated,
          }),
        },
      });

      return app;
    });

    return NextResponse.json({ success: true, admission: updated }, { status: 200 });
  } catch (err: any) {
    console.error("PUT /admissions/:id error:", err);

    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.flatten().fieldErrors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------------------------------- */
/*                              DELETE /:id                                   */
/* -------------------------------------------------------------------------- */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const schoolAccount = await SchoolAccount.init(req);
    if (!schoolAccount)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.application.deleteMany({
      where: {
        id: params.id,
        schoolId: schoolAccount.schoolId,
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("DELETE /admissions/:id error:", err);
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------------------------------- */
/*                               Design reasoning                              */
/* -------------------------------------------------------------------------- */
/*
- Step 0 creation stays POST-only on /api/admissions
- All subsequent steps use PUT on /api/admissions/:id
- Validation is schema-driven per step
- Progress is server-derived and never trusted from the client
*/

/* -------------------------------------------------------------------------- */
/*                                  Structure                                 */
/* -------------------------------------------------------------------------- */
/*
GET    → fetch full admission
PUT    → update a single step
DELETE → remove draft admission
*/

/* -------------------------------------------------------------------------- */
/*                           Implementation guidance                           */
/* -------------------------------------------------------------------------- */
/*
- Client must always send { step: number, ...payload }
- StepSchemas enforce allowed fields per step
- Transactions protect partial writes
*/

/* -------------------------------------------------------------------------- */
/*                             Scalability insight                              */
/* -------------------------------------------------------------------------- */
/*
This route scales cleanly:
- Step logic is schema-driven
- New steps require no route changes
- Can be extended to audit logs or workflow transitions
*/
