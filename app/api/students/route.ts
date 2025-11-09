// app/api/students/route.ts
// Purpose: Collection route for Students - list (GET) and create (POST)

"use server";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma.ts";
import { z } from "zod";
import { cookieUser } from "@lib/cookieUser.ts";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

// ------------------------- Schemas -------------------------
const studentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  classId: z.string().optional(),
  enrolledAt: z
    .preprocess((val) => (val ? new Date(val as string) : undefined), z.date())
    .optional(),
});

type SortBy = "name" | "email" | "enrolledAt";
type SortOrder = "asc" | "desc";

// ------------------------- GET: List students -------------------------
export async function GET(req: NextRequest) {
  const user = await cookieUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const classId = url.searchParams.get("classId");
  const search = url.searchParams.get("search") || "";
  const page = Number(url.searchParams.get("page") || 1);
  const perPage = Number(url.searchParams.get("perPage") || 10);
  const sortBy = (url.searchParams.get("sortBy") || "name") as SortBy;
  const sortOrder = (url.searchParams.get("sortOrder") || "asc") as SortOrder;

  const validSortFields: SortBy[] = ["name", "email", "enrolledAt"];
  if (!validSortFields.includes(sortBy)) {
    return NextResponse.json({ error: "Invalid sortBy field" }, { status: 400 });
  }

  const where: any = { schoolId: user.schoolId };
  if (classId) where.classId = classId;
  if (search) {
    where.OR = [
      { user: { name: { contains: search, mode: "insensitive" } } },
      { user: { email: { contains: search, mode: "insensitive" } } },
    ];
  }

  let orderBy: any = {};
  if (sortBy === "name") orderBy.user = { name: sortOrder };
  else if (sortBy === "email") orderBy.user = { email: sortOrder };
  else orderBy[sortBy] = sortOrder;

  try {
    const [students, total] = await prisma.$transaction([
      prisma.student.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          class: { select: { id: true, name: true } },
          parents: true,
          exams: true,
          transactions: true,
          attendances: true,
        },
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy,
      }),
      prisma.student.count({ where }),
    ]);

    const totalPages = Math.ceil(total / perPage);
    return NextResponse.json({ data: students, total, page, perPage, totalPages });
  } catch (err: any) {
    console.error("GET /api/students failed:", err);
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
  }
}

// ------------------------- POST: Create new student -------------------------
export async function POST(req: NextRequest) {
  const user = await cookieUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = studentSchema.parse(body);

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const newUser = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: Role.STUDENT,
        schoolId: user.schoolId,
        student: {
          create: {
            classId: data.classId,
            enrolledAt: data.enrolledAt ?? new Date(),
            schoolId: user.schoolId,
          },
        },
      },
      include: {
        student: {
          include: {
            class: true,
            parents: true,
            exams: true,
            transactions: true,
            attendances: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        data: {
          ...newUser.student,
          user: { id: newUser.id, name: newUser.name, email: newUser.email },
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.flatten() }, { status: 400 });
    console.error("POST /api/students failed:", err);
    return NextResponse.json({ error: err.message || "Unexpected error" }, { status: 500 });
  }
}

/**
 * -------------------------
 * Design reasoning → Full collection route for listing and creating students with validation, auth, server-side sort, and pagination.
 * Structure → GET + POST with filters, pagination, sort.
 * Implementation guidance → Pass classId, search, page, perPage, sortBy, sortOrder from store.
 * Scalability insight → Extend sort/filter/pagination easily for large datasets.
 */
