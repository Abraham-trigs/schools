// app/api/students/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db.ts";
import { SchoolAccount } from "@/lib/schoolAccount.ts";
import { z } from "zod";

async function authorize(req: NextRequest) {
  const schoolAccount = await SchoolAccount.init(req);
  if (!schoolAccount) return null;
  return schoolAccount;
}

const createStudentSchema = z.object({
  userId: z.string().uuid(),
  classId: z.string().uuid().optional(),
  gradeId: z.string().uuid().optional(),
});

function parseQuery(url: URL) {
  const params = Object.fromEntries(url.searchParams.entries());
  const page = Math.max(parseInt(params.page || "1", 10) || 1, 1);
  const perPage = Math.max(parseInt(params.perPage || "20", 10) || 20, 1);

  return {
    page,
    perPage,
    search: params.search?.trim() || "",
    sortBy: params.sortBy || "surname",
    sortOrder: params.sortOrder === "desc" ? "desc" : "asc",
    classId: params.classId || undefined,
    gradeId: params.gradeId || undefined,
  };
}

function formatListItem(s: any) {
  return {
    id: s.id,
    userId: s.userId,
    name: [s.user.firstName, s.user.surname, s.user.otherNames].filter(Boolean).join(" "),
    email: s.user.email,
    classId: s.Class?.id || null,
    className: s.Class?.name || null,
    gradeId: s.Grade?.id || null,
    gradeName: s.Grade?.name || null,
    admissionId: s.application?.id || null,
  };
}

export async function GET(req: NextRequest) {
  try {
    const schoolAccount = await authorize(req);
    if (!schoolAccount)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { page, perPage, search, sortBy, sortOrder, classId, gradeId } = parseQuery(req.nextUrl);

    const where: any = { schoolId: schoolAccount.schoolId };

    if (search) {
      where.OR = [
        { user: { firstName: { contains: search, mode: "insensitive" } } },
        { user: { surname: { contains: search, mode: "insensitive" } } },
        { user: { otherNames: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (classId) where.classId = classId;
    if (gradeId) where.gradeId = gradeId;

    const total = await prisma.student.count({ where });

    const students = await prisma.student.findMany({
      where,
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        user: true,
        Class: true,
        Grade: true,
        application: true,
      },
      orderBy: { user: { [sortBy]: sortOrder } },
    });

    return NextResponse.json({
      students: students.map(formatListItem),
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const schoolAccount = await authorize(req);
    if (!schoolAccount)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const raw = await req.json();
    const parsed = createStudentSchema.safeParse(raw);
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

    const { userId, classId, gradeId } = parsed.data;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const student = await prisma.student.create({
      data: {
        userId,
        schoolId: schoolAccount.schoolId,
        classId,
        gradeId,
      },
      include: { user: true, Class: true, Grade: true, application: true },
    });

    return NextResponse.json({ student }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Create failed" }, { status: 400 });
  }
}
