// app/api/classes/route.ts
// Purpose: List, query, and create classes with full relations for a school

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db.ts";
import { SchoolAccount } from "@/lib/schoolAccount.ts";
import { z } from "zod";

// -------------------- Schemas --------------------
const createClassSchema = z.object({
  name: z.string().min(1, "Class name is required"),
});

const querySchema = z.object({
  page: z.string().optional(),
  perPage: z.string().optional(),
  search: z.string().optional(),
  staffId: z.string().optional(),
  subjectId: z.string().optional(),
  examId: z.string().optional(),
  studentId: z.string().optional(),
});

// -------------------- Helper --------------------
function addFullNameToUsers<
  T extends { user: { firstName?: string; surname?: string; otherNames?: string } }
>(items: T[]) {
  return items.map((x) => ({
    ...x,
    user: {
      ...x.user,
      fullName: [x.user.firstName, x.user.surname, x.user.otherNames].filter(Boolean).join(" "),
    },
  }));
}

// -------------------- GET Classes --------------------
export async function GET(req: NextRequest) {
  try {
    // Authenticate school
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Parse query params with validation and normalization
    const { searchParams } = new URL(req.url);
    const query = querySchema.parse(Object.fromEntries(searchParams.entries()));
    const page = Math.max(Number(query.page ?? 1), 1);
    const perPage = Math.max(Number(query.perPage ?? 10), 1);

    // Build Prisma where clause scoped to school
    const where: Parameters<typeof prisma.class.findMany>[0]["where"] = {
      schoolId: schoolAccount.schoolId,
      ...(query.search ? { name: { contains: query.search, mode: "insensitive" } } : {}),
      ...(query.staffId ? { staff: { some: { id: query.staffId } } } : {}),
      ...(query.subjectId ? { subjects: { some: { id: query.subjectId } } } : {}),
      ...(query.examId ? { exams: { some: { id: query.examId } } } : {}),
      ...(query.studentId ? { students: { some: { id: query.studentId } } } : {}),
    };

    const total = await prisma.class.count({ where });

    const classes = await prisma.class.findMany({
      where,
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { name: "asc" },
      include: {
        grades: { select: { id: true, name: true } },
        staff: {
          select: {
            id: true,
            position: true,
            hireDate: true,
            user: { select: { id: true, firstName: true, surname: true, otherNames: true, email: true } },
          },
        },
        subjects: { select: { id: true, name: true } },
        exams: { select: { id: true, title: true } },
        students: {
          select: {
            id: true,
            userId: true,
            enrolledAt: true,
            user: { select: { id: true, firstName: true, surname: true, otherNames: true, email: true } },
          },
        },
      },
    });

    const classesWithFullNames = classes.map((cls) => ({
      ...cls,
      staff: addFullNameToUsers(cls.staff),
      students: addFullNameToUsers(cls.students),
    }));

    return NextResponse.json({ classes: classesWithFullNames, total, page, perPage });
  } catch (err: any) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: err.errors }, { status: 400 });

    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

// -------------------- POST Create Class --------------------
export async function POST(req: NextRequest) {
  try {
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const data = createClassSchema.parse(body);

    const newClass = await prisma.class.create({
      data: {
        name: data.name,
        schoolId: schoolAccount.schoolId,
        grades: { create: [{ name: "A" }, { name: "B" }, { name: "C" }] },
      },
      include: { grades: true },
    });

    return NextResponse.json(newClass, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: err.errors }, { status: 400 });

    return NextResponse.json({ error: err.message || "Failed to create class" }, { status: 500 });
  }
}

/*
Design reasoning:
- Uses argument-free SchoolAccount.init() to enforce multi-tenant data access
- GET supports search, staff/subject/exam/student filters, and pagination
- POST creates default grades for new classes to simplify setup

Structure:
- GET() → fetch paginated classes with full relations
- POST() → create a new class for the authenticated school
- Helper addFullNameToUsers() formats staff/student names consistently

Implementation guidance:
- Drop this file into /app/api/classes
- Frontend can query GET with ?page=&perPage=&search=&staffId=&subjectId=&examId=&studentId=
- POST expects { name: string } payload; returns new class with grades

Scalability insight:
- Flexible filters allow addition of new relations without changing core logic
- Pagination scales to thousands of classes
- Can add caching or batch-loading of related entities without breaking API contract
*/
