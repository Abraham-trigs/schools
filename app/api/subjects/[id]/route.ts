// app/api/subjects/[id]/route.ts — Retrieve, update, and delete a single Subject.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookieUser } from "@/lib/cookieUser";
import { z } from "zod";

const subjectSchema = z.object({
  name: z.string().min(1).trim(),
  code: z.string().min(1).trim(),
  description: z.string().optional().nullable(),
});

const normalizeInput = (input: any) => ({
  name: input.name?.trim(),
  code: input.code?.trim().toUpperCase(),
  description: input.description?.trim() || null,
});

// ------------------------- GET -------------------------
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await cookieUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const subject = await prisma.subject.findFirst({
      where: { id: params.id, schoolId: user.schoolId },
    });
    if (!subject) return NextResponse.json({ error: "Subject not found" }, { status: 404 });

    return NextResponse.json(subject);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Failed to fetch subject" }, { status: 500 });
  }
}

// ------------------------- PUT -------------------------
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await cookieUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const json = await req.json();
    const parsed = subjectSchema.safeParse(normalizeInput(json));
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

    const subject = await prisma.subject.findFirst({
      where: { id: params.id, schoolId: user.schoolId },
    });
    if (!subject) return NextResponse.json({ error: "Subject not found" }, { status: 404 });

    const codeExists = await prisma.subject.findFirst({
      where: {
        code: parsed.data.code,
        schoolId: user.schoolId,
        NOT: { id: params.id },
      },
    });
    if (codeExists)
      return NextResponse.json({ error: "Subject code already exists" }, { status: 409 });

    const updated = await prisma.subject.update({
      where: { id: params.id },
      data: parsed.data,
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Failed to update subject" }, { status: 500 });
  }
}

// ------------------------- DELETE -------------------------
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await cookieUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const subject = await prisma.subject.findFirst({
      where: { id: params.id, schoolId: user.schoolId },
    });
    if (!subject) return NextResponse.json({ error: "Subject not found" }, { status: 404 });

    await prisma.subject.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Failed to delete subject" }, { status: 500 });
  }
}

/*
Design reasoning → Symmetrical CRUD design for Subjects. PUT and DELETE share validation and authorization logic to prevent cross-school access. 

Structure → Exports GET + PUT + DELETE. Each checks auth, validates ownership, and returns consistent error shapes.

Implementation guidance → Drop in /app/api/subjects/[id]/. Works directly with useSubjectStore actions (updateSubject, deleteSubject). 

Scalability insight → Future-safe for bulk actions (batch delete or update). Wrap in prisma.$transaction if cascading related data (e.g., subject-class links).
*/
