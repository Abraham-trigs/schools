import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SchoolAccount } from "@/lib/schoolAccount";
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

// ------------------------- GET Subjects -------------------------
export async function GET(req: NextRequest) {
  try {
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 10);
    const search = searchParams.get("search")?.trim() || "";

    const where: any = { schoolId: schoolAccount.schoolId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
      ];
    }

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

// ------------------------- POST Subject -------------------------
export async function POST(req: NextRequest) {
  try {
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const json = await req.json();
    const parsed = subjectSchema.safeParse(normalizeInput(json));
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const exists = await prisma.subject.findFirst({
      where: { code: parsed.data.code, schoolId: schoolAccount.schoolId },
    });
    if (exists) return NextResponse.json({ error: "Subject code already exists" }, { status: 409 });

    const subject = await prisma.subject.create({
      data: {
        ...parsed.data,
        schoolId: schoolAccount.schoolId,
        createdById: schoolAccount.info.id,
      },
      include: { createdBy: { select: { id: true, name: true, role: true } } },
    });

    return NextResponse.json(subject, { status: 201 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Failed to create subject" }, { status: 500 });
  }
}
