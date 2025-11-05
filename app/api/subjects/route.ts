// app/api/subjects/route.ts — List and create Subjects scoped to authenticated user's school.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookieUser } from "@/lib/cookieUser";
import { z } from "zod";

// ------------------------- Schema -------------------------
const subjectSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  code: z.string().min(1, "Code is required").trim(),
  description: z.string().optional().nullable(),
});

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

    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 10);
    const search = searchParams.get("search")?.trim() || "";

    const where = {
      schoolId: user.schoolId,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { code: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [data, total] = await prisma.$transaction([
      prisma.subject.findMany({
        where,
        orderBy: { name: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.subject.count({ where }),
    ]);

    return NextResponse.json({
      data,
      meta: { total, page, limit },
    });
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

    const json = await req.json();
    const parsed = subjectSchema.safeParse(normalizeInput(json));
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

    const exists = await prisma.subject.findFirst({
      where: { code: parsed.data.code, schoolId: user.schoolId },
    });
    if (exists) return NextResponse.json({ error: "Subject code already exists" }, { status: 409 });

    const subject = await prisma.subject.create({
      data: { ...parsed.data, schoolId: user.schoolId },
    });

    return NextResponse.json(subject, { status: 201 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Failed to create subject" }, { status: 500 });
  }
}

/* 
Design reasoning → Matches existing pattern (StudentsPage, Staff API). Unified Zod schema enforces validation consistency and normalization. GET supports pagination, search, and school scoping. POST normalizes and deduplicates codes for safe creation.

Structure → Exports GET + POST. Helpers: normalizeInput. Uses prisma.$transaction for count + list. Returns { data, meta } to match useSubjectStore.

Implementation guidance → Drop in /app/api/subjects/. Store already expects this shape. Ensure prisma model `Subject` has fields: id, name, code, description, schoolId.

Scalability insight → Add filters (e.g., department, level) by extending `where`. Pagination can later move to cursor-based if dataset grows large.
*/
