// app/api/subjects/[id]/route.ts
// Purpose: Retrieve, update, and delete a single Subject scoped to user's school

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookieUser } from "@/lib/cookieUser";
import { z } from "zod";

// ------------------------- Schema -------------------------
const subjectSchema = z.object({
  name: z.string().min(1, "Name is required").transform((s) => s.trim()),
  code: z.string().min(1, "Code is required").transform((s) => s.trim().toUpperCase()),
  description: z.string().optional().nullable().transform((v) => {
    if (v === undefined) return null;
    const t = v as string | null;
    return (t ?? "").trim() === "" ? null : (t ?? null);
  }),
});

type SubjectInput = z.infer<typeof subjectSchema>;
type UserSession = { id: string; schoolId: string };

// Normalize input to ensure consistent types
const normalizeInput = (input: any): any => ({
  name: typeof input.name === "string" ? input.name.trim() : input.name,
  code: typeof input.code === "string" ? input.code.trim().toUpperCase() : input.code,
  description:
    input.description === undefined || input.description === null
      ? null
      : String(input.description).trim() === ""
      ? null
      : String(input.description).trim(),
});

// JSON error helper
const jsonError = (payload: { error: string | Record<string, string[]> }, status = 400) =>
  NextResponse.json(payload, { status });

// ------------------------- GET -------------------------
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = (await cookieUser(req)) as UserSession | null;
    if (!user) return jsonError({ error: "Unauthorized" }, 401);

    const subjectId = params.id;
    if (!subjectId) return jsonError({ error: "Missing subject id" }, 400);

    const subject = await prisma.subject.findFirst({
      where: { id: subjectId, schoolId: user.schoolId },
      include: { createdBy: { select: { id: true, name: true, role: true } } },
    });

    if (!subject) return jsonError({ error: "Subject not found" }, 404);

    return NextResponse.json(subject);
  } catch (err: any) {
    console.error("GET /api/subjects/[id] error:", err);
    return jsonError({ error: err?.message || "Failed to fetch subject" }, 500);
  }
}

// ------------------------- PUT -------------------------
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = (await cookieUser(req)) as UserSession | null;
    if (!user) return jsonError({ error: "Unauthorized" }, 401);

    const subjectId = params.id;
    if (!subjectId) return jsonError({ error: "Missing subject id" }, 400);

    const raw = await req.json();
    const normalized = normalizeInput(raw);

    const parsed = subjectSchema.safeParse(normalized);
    if (!parsed.success) return jsonError({ error: parsed.error.flatten().fieldErrors }, 400);

    const payload: SubjectInput = parsed.data;

    // Transaction: check existence + duplicate code before update
    const [existingSubject, duplicateCode] = await prisma.$transaction([
      prisma.subject.findFirst({ where: { id: subjectId, schoolId: user.schoolId }, select: { id: true } }),
      prisma.subject.findFirst({
        where: { code: payload.code, schoolId: user.schoolId, NOT: { id: subjectId } },
        select: { id: true },
      }),
    ]);

    if (!existingSubject) return jsonError({ error: "Subject not found" }, 404);
    if (duplicateCode) return jsonError({ error: "Subject code already exists" }, 409);

    const updated = await prisma.subject.update({
      where: { id: subjectId },
      data: { name: payload.name, code: payload.code, description: payload.description },
      include: { createdBy: { select: { id: true, name: true, role: true } } },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("PUT /api/subjects/[id] error:", err);
    return jsonError({ error: err?.message || "Failed to update subject" }, 500);
  }
}

// ------------------------- DELETE -------------------------
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = (await cookieUser(req)) as UserSession | null;
    if (!user) return jsonError({ error: "Unauthorized" }, 401);

    const subjectId = params.id;
    if (!subjectId) return jsonError({ error: "Missing subject id" }, 400);

    const subject = await prisma.subject.findFirst({ where: { id: subjectId, schoolId: user.schoolId }, select: { id: true } });
    if (!subject) return jsonError({ error: "Subject not found" }, 404);

    // Delete the subject (consider soft-delete if relations exist)
    await prisma.subject.delete({ where: { id: subjectId } });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/subjects/[id] error:", err);
    return jsonError({ error: err?.message || "Failed to delete subject" }, 500);
  }
}

/*
Design notes:
- GET returns full subject object + minimal `createdBy` relation for UI.
- PUT validates input, checks duplicates, and updates within school scope.
- DELETE ensures subject belongs to school before removing.
- All routes use cookie-based auth and are scoped to `schoolId`.
*/
