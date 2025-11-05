// app/api/subjects/route.ts
// Purpose: Handle listing and creating subjects with search, pagination, filters, auth, and createdBy info

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { cookieUser } from "@/lib/cookieUser.ts";

const subjectSchema = z.object({
  name: z.string().min(1),
  code: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const user = await cookieUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const search = url.searchParams.get("search") || "";
  const page = Number(url.searchParams.get("page") || 1);
  const limit = Number(url.searchParams.get("limit") || 20);
  const skip = (page - 1) * limit;

  const filters: any = {};

  // Apply classId filter
  const classId = url.searchParams.get("classId");
  if (classId) {
    filters.classes = { some: { id: classId } };
  }

  // Apply staffId filter
  const staffId = url.searchParams.get("staffId");
  if (staffId) {
    filters.staff = { some: { userId: staffId } };
  }

  // Apply date range filter
  const fromDate = url.searchParams.get("fromDate");
  const toDate = url.searchParams.get("toDate");
  if (fromDate || toDate) {
    filters.createdAt = {};
    if (fromDate) filters.createdAt.gte = new Date(fromDate);
    if (toDate) filters.createdAt.lte = new Date(toDate);
  }

  const subjects = await prisma.subject.findMany({
    where: {
      name: { contains: search, mode: "insensitive" },
      ...filters,
    },
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },
    include: { createdBy: { select: { id: true, name: true, role: true } } },
  });

  const total = await prisma.subject.count({
    where: {
      name: { contains: search, mode: "insensitive" },
      ...filters,
    },
  });

  return NextResponse.json({ data: subjects, meta: { total, page, limit } });
}

export async function POST(req: NextRequest) {
  const user = await cookieUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json();
  const parsed = subjectSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const subject = await prisma.subject.create({
    data: {
      ...parsed.data,
      createdById: user.id,
    },
    include: { createdBy: { select: { id: true, name: true, role: true } } },
  });

  return NextResponse.json(subject, { status: 201 });
}

/*
Design reasoning:
- Filters now fully align with the store, allowing class, staff, and date range queries.
- Maintains createdBy info for audit transparency.
- Pagination/search remains intact.

Structure:
- GET: list with filters, pagination, search
- POST: create with server-side createdById

Implementation guidance:
- Front-end passes filter params via query string; GET handler maps them to Prisma where conditions.
- Date filtering coerces ISO strings to Date objects.
- Supports future extensions like department or term filters.

Scalability insight:
- Easy to add more filter fields (e.g., subject code, schoolId).
- Supports infinite scroll or dynamic filter combinations without changing store logic.
*/
