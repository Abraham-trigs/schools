// app/api/staff/route.ts
// Purpose: Staff collection API – list with pagination, search, filters, sorting, debounce; create staff with transactional user reference, multi-subject support, and field-level error responses

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { cookieUser } from "@/lib/cookieUser";
import { requiresClass, requiresSubjects, inferDepartmentFromPosition } from "@/lib/api/constants/roleInference";

// ------------------------- Schemas -------------------------
const staffCreateSchema = z.object({
  userId: z.string(),
  position: z.string(),
  salary: z.number(),
  hireDate: z.string(),
  classId: z.string().optional().nullable(),
  subjectIds: z.array(z.string()).optional(),
  department: z.string().optional(),
  busId: z.string().optional().nullable(),
});

const staffQuerySchema = z.object({
  search: z.string().optional(),
  department: z.string().optional(),
  classId: z.string().optional(),
  subjectId: z.string().optional(),
  busId: z.string().optional(),
  hiredFrom: z.string().optional(),
  hiredTo: z.string().optional(),
  createdFrom: z.string().optional(),
  createdTo: z.string().optional(),
  page: z.preprocess((val) => Number(val), z.number().min(1)).optional(),
  perPage: z.preprocess((val) => Number(val), z.number().min(1).max(100)).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  debounce: z.preprocess((val) => Number(val), z.number().min(0)).optional(),
});

// ------------------------- GET: List Staff -------------------------
export async function GET(req: NextRequest) {
  const authUser = await cookieUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const url = new URL(req.url);
    const query = staffQuerySchema.parse(Object.fromEntries(url.searchParams));

    if (query.debounce) await new Promise((res) => setTimeout(res, query.debounce));

    const where: any = { schoolId: authUser.schoolId };
    if (query.search) where.position = { contains: query.search, mode: "insensitive" };
    if (query.department) where.department = query.department;
    if (query.classId) where.classId = query.classId;
    if (query.subjectId) where.subjects = { some: { id: query.subjectId } };
    if (query.busId) where.busId = query.busId;
    if (query.hiredFrom || query.hiredTo) {
      where.hireDate = {};
      if (query.hiredFrom) where.hireDate.gte = new Date(query.hiredFrom);
      if (query.hiredTo) where.hireDate.lte = new Date(query.hiredTo);
    }
    if (query.createdFrom || query.createdTo) {
      where.createdAt = {};
      if (query.createdFrom) where.createdAt.gte = new Date(query.createdFrom);
      if (query.createdTo) where.createdAt.lte = new Date(query.createdTo);
    }

    const total = await prisma.staff.count({ where });
    const orderBy: any = {};
    if (query.sortBy) orderBy[query.sortBy] = query.sortOrder || "asc";

    const staff = await prisma.staff.findMany({
      where,
      include: { user: true, subjects: true, class: true },
      skip: ((query.page || 1) - 1) * (query.perPage || 10),
      take: query.perPage || 10,
      orderBy: orderBy || { hireDate: "desc" },
    });

    return NextResponse.json({
      staff,
      total,
      page: query.page || 1,
      perPage: query.perPage || 10,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.flatten() }, { status: 400 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ------------------------- POST: Create Staff -------------------------
export async function POST(req: NextRequest) {
  const authUser = await cookieUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = staffCreateSchema.parse(body);

    const user = await prisma.user.findFirst({ where: { id: data.userId, schoolId: authUser.schoolId } });
    if (!user) return NextResponse.json({ error: "Referenced user not found in your school" }, { status: 400 });

    if (requiresClass(data.position) && !data.classId)
      return NextResponse.json({ error: { classId: ["Class is required for this position"] } }, { status: 400 });

    if (requiresSubjects(data.position) && (!data.subjectIds || data.subjectIds.length === 0))
      return NextResponse.json({ error: { subjectIds: ["At least one subject required"] } }, { status: 400 });

    const createdStaff = await prisma.$transaction(async (tx) => {
      const staff = await tx.staff.create({
        data: {
          userId: data.userId,
          position: data.position,
          department: data.department || inferDepartmentFromPosition(data.position),
          salary: data.salary,
          hireDate: new Date(data.hireDate),
          classId: data.classId ?? null,
          busId: data.busId ?? null,
          subjects: data.subjectIds ? { connect: data.subjectIds.map((id) => ({ id })) } : undefined,
          schoolId: authUser.schoolId,
        },
        include: { user: true, subjects: true, class: true },
      });

      // Example: could update related User record transactionally
      // await tx.user.update({ where: { id: staff.userId }, data: { department: staff.department } });

      return staff;
    });

    return NextResponse.json(createdStaff, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.flatten() }, { status: 400 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ------------------------- Design reasoning → -------------------------
// Full-featured Staff collection route supports filtering (search, department, class, subject, busId, hireDate, createdAt), pagination, sorting, debounce, transactional creation with multi-subject support, field-level error responses for inline form validation, and school scoping for security.

// ------------------------- Structure → -------------------------
// GET → list staff with filters, pagination, sorting, debounce
// POST → create staff transactionally with validation, multi-subject connection, and optional busId/department/createdAt

// ------------------------- Implementation guidance → -------------------------
// Frontend calls GET with query filters; POST returns full staff object including user and subjects for optimistic updates. Extensible transaction blocks allow adding updates to related models (User, Class) without breaking API. Field-level errors support inline form validation.

// ------------------------- Scalability insight → -------------------------
// Easily extended with additional filters, transactional updates for related models, dynamic validations, and future optional fields (e.g., payroll, attendance). Supports school-scoped multi-tenancy and safe optimistic UI updates.
