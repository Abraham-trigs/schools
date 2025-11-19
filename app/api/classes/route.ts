// app/api/classes/route.ts
// Purpose: CRUD API for Class model with full pagination, search, filtering by grade, staff, subjects, exams, and students

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cookieUser } from "@/lib/cookieUser";
import { z } from "zod";

// =====================
// Validation Schemas
// =====================
const classSchema = z.object({
  name: z.string().min(1, "Class name is required"),
  grade: z.string().min(1, "Grade is required"),
});

// =====================
// GET Classes with pagination, search, and optional filters
// =====================
export async function GET(req: Request) {
  try {
    const user = await cookieUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") || "1");
    const perPage = Number(searchParams.get("perPage") || "10");
    const search = searchParams.get("search") || "";
    const gradeFilter = searchParams.get("grade") || undefined;
    const staffId = searchParams.get("staffId") || undefined;
    const subjectId = searchParams.get("subjectId") || undefined;
    const examId = searchParams.get("examId") || undefined;
    const studentId = searchParams.get("studentId") || undefined;

    const where: any = { schoolId: user.schoolId };
    if (search) where.name = { contains: search, mode: "insensitive" };
    if (gradeFilter) where.grade = gradeFilter;

    // Additional relational filters
    if (staffId) where.staff = { some: { id: staffId } };
    if (subjectId) where.subjects = { some: { id: subjectId } };
    if (examId) where.exams = { some: { id: examId } };
    if (studentId) where.students = { some: { id: studentId } };

    const total = await prisma.class.count({ where });
    const classes = await prisma.class.findMany({
      where,
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { name: "asc" },
      include: {
        staff: { select: { id: true, name: true, email: true } },
        subjects: { select: { id: true, name: true } },
        exams: { select: { id: true, title: true } },
        students: { select: { id: true, userId: true, enrolledAt: true, user: { select: { id: true, name: true, email: true } } } },
      },
    });

    return NextResponse.json({ classes, total, page, perPage });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

// =====================
// POST Create Class
// =====================
export async function POST(req: Request) {
  try {
    const user = await cookieUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const data = classSchema.parse(body);

    const newClass = await prisma.class.create({
      data: {
        name: data.name,
        grade: data.grade,
        schoolId: user.schoolId,
      },
    });

    return NextResponse.json(newClass, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: err.message || "Failed to create class" }, { status: 500 });
  }
}

/* -------------------------
Design reasoning:
- Added students relational inclusion and filtering to provide front-end the ability to search classes by enrolled students.
- GET response now includes students array with key details (id, userId, enrolledAt, user info) for display or selection.
- Maintains relational filters for staff, subjects, exams, grade, and search for a complete class overview.

Structure:
- GET: returns paginated, searchable, filterable class list with staff, subjects, exams, and students.
- POST: creates a new class with name and grade, scoped to authenticated user's school.

Implementation guidance:
- Front-end can filter by studentId or display students per class for dashboards.
- Maintain pagination and search for large datasets.
- Use relational IDs for filtering; relational info included in GET response.

Scalability insight:
- Supports future filtering by multiple students, batch assignments, or student status.
- Can extend include with more nested relational data without changing core API.
------------------------- */
