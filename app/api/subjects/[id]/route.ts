// app/api/subjects/[id]/route.ts
// Purpose: Handle GET, PUT, DELETE for a single Subject with full JSON responses

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { cookieUser } from "@/lib/cookieUser.ts";

const subjectSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().optional().nullable(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await cookieUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subject = await prisma.subject.findUnique({
    where: { id: params.id },
    include: {
      createdBy: { select: { id: true, name: true, role: true } },
      staff: { select: { userId: true, user: { select: { id: true, name: true, role: true } } } },
      classes: true,
    },
  });

  if (!subject) return NextResponse.json({ error: "Subject not found" }, { status: 404 });

  return NextResponse.json({ data: subject });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await cookieUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => ({}));
  const parsed = subjectSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const updated = await prisma.subject.update({
    where: { id: params.id },
    data: parsed.data,
    include: {
      createdBy: { select: { id: true, name: true, role: true } },
      staff: { select: { userId: true, user: { select: { id: true, name: true, role: true } } } },
      classes: true,
    },
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await cookieUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const deleted = await prisma.subject.delete({
      where: { id: params.id },
    });
    // Always return wrapped in data for consistency
    return NextResponse.json({ data: deleted });
  } catch (err: any) {
    if (err.code === "P2025") {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to delete subject" }, { status: 500 });
  }
}

/*
Design reasoning:
- All responses now consistently return a JSON object with a `data` or `error` field.
- This avoids `Unexpected end of JSON input` on the frontend.
- GET/PUT/DELETE endpoints aligned to return full objects for predictable store handling.

Structure:
- GET: fetch single subject (data wrapped)
- PUT: update subject (data wrapped)
- DELETE: delete subject (data wrapped)

Implementation guidance:
- Frontend should always do `const { data, error } = await res.json()` safely.
- Prevent empty response bodies which break JSON parsing.
- Use try/catch on fetch to handle server errors gracefully.

Scalability insight:
- Consistent response wrapper (`{ data, error }`) allows the same parsing pattern for all collection and item routes.
*/
