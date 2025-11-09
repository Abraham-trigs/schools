import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/cookieUser.ts";
import { cookieUser } from "@lib/cookieUser.ts";
import { z } from "zod";

// ------------------------- Schema -------------------------
const subjectSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  code: z.string().optional().nullable().transform((v) => (v ? v.toUpperCase() : null)),
  description: z.string().optional().nullable(),
  classIds: z.array(z.string()).optional(),
  staffIds: z.array(z.string()).optional(),
});

// ------------------------- Helpers -------------------------
const normalizeInput = (input: any) => ({
  name: input.name?.trim(),
  code: input.code?.trim().toUpperCase() || null,
  description: input.description?.trim() || null,
  classIds: input.classIds || [],
  staffIds: input.staffIds || [],
});

const jsonError = (payload: { error: string | Record<string, string[]> }, status = 400) =>
  NextResponse.json(payload, { status });

// ------------------------- GET: List Subjects -------------------------
export async function GET(req: NextRequest) {
  try {
    const user = await cookieUser();
    if (!user) return jsonError({ error: "Unauthorized" }, 401);

    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 10);
    const search = searchParams.get("search")?.trim() || "";
    const classId = searchParams.get("classId");
    const staffId = searchParams.get("staffId");

    const where: any = { schoolId: user.schoolId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (classId) where.classes = { some: { id: classId } };
    if (staffId) where.staff = { some: { userId: staffId } };

    const [data, total] = await prisma.$transaction([
      prisma.subject.findMany({
        where,
        include: {
          createdBy: { select: { id: true, name: true, role: true } },
          classes: { select: { id: true, name: true } },
          staff: { select: { id: true, user: { select: { id: true, name: true } } } },
        },
        orderBy: { name: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.subject.count({ where }),
    ]);

    return NextResponse.json({ data, meta: { total, page, limit } });
  } catch (err: any) {
    console.error("GET /api/subjects error:", err);
    return jsonError({ error: err.message || "Failed to fetch subjects" }, 500);
  }
}

// ------------------------- POST: Create Subject -------------------------
export async function POST(req: NextRequest) {
  try {
    const user = await cookieUser();
    if (!user) return jsonError({ error: "Unauthorized" }, 401);

    if (!["ADMIN", "PRINCIPAL"].includes(user.role))
      return jsonError({ error: "Forbidden" }, 403);

    const body = await req.json();
    const data = normalizeInput(body);

    const parsed = subjectSchema.safeParse(data);
    if (!parsed.success) return jsonError({ error: parsed.error.flatten().fieldErrors }, 400);

    const newSubject = await prisma.$transaction(async (tx) => {
      const exists = await tx.subject.findFirst({
        where: { name: parsed.data.name, schoolId: user.schoolId },
      });
      if (exists) throw new Error("Subject name already exists");

      // ✅ Correct usage of relations
      return tx.subject.create({
        data: {
          name: parsed.data.name,
          code: parsed.data.code,
          description: parsed.data.description,
          schoolId: user.schoolId,
          createdById: user.id,
          classes: parsed.data.classIds.length
            ? { connect: parsed.data.classIds.map((id) => ({ id })) }
            : undefined,
          staff: parsed.data.staffIds.length
            ? { connect: parsed.data.staffIds.map((id) => ({ id })) }
            : undefined,
        },
        include: {
          createdBy: { select: { id: true, name: true, role: true } },
          classes: { select: { id: true, name: true } },
          staff: { select: { id: true, user: { select: { id: true, name: true } } } },
        },
      });
    });

    return NextResponse.json(newSubject, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/subjects error:", err);
    const status = err.message.includes("exists") ? 409 : 500;
    return jsonError({ error: err.message || "Failed to create subject" }, status);
  }
}
