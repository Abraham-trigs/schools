import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookieUser } from "@/lib/cookieUser";
import { z } from "zod";

// ------------------------- Schema -------------------------
const subjectSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  code: z.string().optional().nullable().transform((v) => (v ? v.toUpperCase() : null)),
  description: z.string().optional().nullable(),
  classIds: z.array(z.string()).optional(),
  staffIds: z.array(z.string()).optional(),
});

const normalizeInput = (input: any) => ({
  name: input.name?.trim(),
  code: input.code?.trim().toUpperCase() || null,
  description: input.description?.trim() || null,
  classIds: input.classIds || [],
  staffIds: input.staffIds || [],
});

const jsonError = (payload: { error: string | Record<string, string[]> }, status = 400) =>
  NextResponse.json(payload, { status });

// ------------------------- GET: Single Subject -------------------------
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await cookieUser();
    if (!user) return jsonError({ error: "Unauthorized" }, 401);

    const subject = await prisma.subject.findFirst({
      where: { id: params.id, schoolId: user.schoolId },
      include: {
        createdBy: { select: { id: true, name: true, role: true } },
        classes: { select: { id: true, name: true } },
        staff: { select: { id: true, name: true } },
      },
    });

    if (!subject) return jsonError({ error: "Subject not found" }, 404);
    return NextResponse.json(subject);
  } catch (err: any) {
    console.error("GET /api/subjects/[id] error:", err);
    return jsonError({ error: err.message || "Failed to fetch subject" }, 500);
  }
}

// ------------------------- PUT: Update Subject -------------------------
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await cookieUser();
    if (!user) return jsonError({ error: "Unauthorized" }, 401);

    // Role-based enforcement
    if (!["ADMIN", "PRINCIPAL"].includes(user.role))
      return jsonError({ error: "Forbidden" }, 403);

    const subjectId = params.id;
    if (!subjectId) return jsonError({ error: "Missing subject id" }, 400);

    const raw = await req.json();
    const data = normalizeInput(raw);

    const parsed = subjectSchema.safeParse(data);
    if (!parsed.success) return jsonError({ error: parsed.error.flatten().fieldErrors }, 400);

    // Transaction: fetch existing subject + check duplicates
    const [existing, duplicate] = await prisma.$transaction([
      prisma.subject.findFirst({ where: { id: subjectId, schoolId: user.schoolId } }),
      prisma.subject.findFirst({
        where: { name: parsed.data.name, schoolId: user.schoolId, NOT: { id: subjectId } },
      }),
    ]);

    if (!existing) return jsonError({ error: "Subject not found" }, 404);
    if (duplicate) return jsonError({ error: "Subject name already exists" }, 409);

    // Prepare relation updates
    const classConnect = parsed.data.classIds?.map((id) => ({ id })) || [];
    const staffConnect = parsed.data.staffIds?.map((id) => ({ id })) || [];

    // Atomic update
    const updated = await prisma.subject.update({
      where: { id: subjectId },
      data: {
        name: parsed.data.name,
        code: parsed.data.code,
        description: parsed.data.description,
        classes: { set: classConnect },
        staff: { set: staffConnect },
      },
      include: {
        createdBy: { select: { id: true, name: true, role: true } },
        classes: { select: { id: true, name: true } },
        staff: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("PUT /api/subjects/[id] error:", err);
    return jsonError({ error: err.message || "Failed to update subject" }, 500);
  }
}


// ------------------------- DELETE: Remove Subject -------------------------
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await cookieUser();
    if (!user) return jsonError({ error: "Unauthorized" }, 401);

    if (!["ADMIN", "PRINCIPAL"].includes(user.role))
      return jsonError({ error: "Forbidden" }, 403);

    const subject = await prisma.subject.findFirst({ where: { id: params.id, schoolId: user.schoolId } });
    if (!subject) return jsonError({ error: "Subject not found" }, 404);

    await prisma.subject.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/subjects/[id] error:", err);
    return jsonError({ error: err.message || "Failed to delete subject" }, 500);
  }
}
