// app/api/subjects/route.ts
// Purpose: List and create Subjects scoped to authenticated user's school with role-based access
// Features: Pagination, search, optional class filtering, creator info, role-based permissions

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookieUser } from "@/lib/cookieUser";
import { z } from "zod";
import { inferRoleFromPosition } from "@/lib/api/constants/roleInference";

// ------------------------- Schema -------------------------
const subjectSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  code: z.string().min(1, "Code is required").trim(),
  description: z.string().optional().nullable(),
});

// Normalize input
const normalizeInput = (input: any) => ({
  name: input.name?.trim(),
  code: input.code?.trim().toUpperCase(),
  description: input.description?.trim() || null,
});

// ------------------------- GET -------------------------
export async function GET(req: NextRequest) {
  try {
    const user = await cookieUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = inferRoleFromPosition(user.position);

    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 10);
    const search = searchParams.get("search")?.trim() || "";
    const classId = searchParams.get("classId");

    const where: any = { schoolId: user.schoolId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
      ];
    }
    if (classId) where.classes = { some: { id: classId } };

    const [data, total] = await prisma.$transaction([
      prisma.subject.findMany({
        where,
        include: { createdBy: { select: { id: true, name: true, role: true } } },
        orderBy: { name: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.subject.count({ where }),
    ]);

    return NextResponse.json({ data, meta: { total, page, limit } });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Failed to fetch subjects" }, { status: 500 });
  }
}

// ------------------------- POST -------------------------
export async function POST(req: NextRequest) {
  try {
    const user = await cookieUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = inferRoleFromPosition(user.position);
    if (!["ADMIN", "PRINCIPAL"].includes(role))
      return NextResponse.json({ error: "Unauthorized", status: 403 });

    const json = await req.json();
    const parsed = subjectSchema.safeParse(normalizeInput(json));
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

    const exists = await prisma.subject.findFirst({
      where: { code: parsed.data.code, schoolId: user.schoolId },
    });
    if (exists) return NextResponse.json({ error: "Subject code already exists" }, { status: 409 });

    const subject = await prisma.subject.create({
      data: {
        ...parsed.data,
        schoolId: user.schoolId,
        createdById: user.id,
      },
      include: { createdBy: { select: { id: true, name: true, role: true } } },
    });

    return NextResponse.json(subject, { status: 201 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Failed to create subject" }, { status: 500 });
  }
}

/*
Design reasoning:
- Centralized role-based access for create & fetch.
- GET supports search, pagination, class filtering; POST ensures uniqueness and creator tracking.
- Users see only subjects in their school; only ADMIN/PRINCIPAL can create.

Structure:
- GET: fetches paginated subjects with optional search/class filters.
- POST: creates a new subject with validation and role enforcement.

Implementation guidance:
- Import and call in Next.js route.
- Combine with `useSubjectStore` on frontend for pagination, search, and CRUD.

Scalability insight:
- Adding new roles or permissions requires only `roleInference` update.
- Can easily extend GET filters (semester, department) without changing store logic.
*/
