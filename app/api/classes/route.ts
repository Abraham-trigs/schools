// app/api/classes/route.ts
// Purpose: RESTful API for managing classes with pagination, search, sorting, nested students, attendance, and role-based security.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { cookieUser } from "@/lib/cookieUser";
import { Role } from "@prisma/client";

// ------------------------- Schemas -------------------------
// Schema for validating class creation input
const classCreateSchema = z.object({
  name: z.string().min(1, "Class name is required"),
});

// Schema for validating class update input (currently unused here)
const classUpdateSchema = z.object({
  name: z.string().min(1, "Class name is required").optional(),
});

// ------------------------- GET: List classes -------------------------
export async function GET(req: NextRequest) {
  // Authenticate user from cookies
  const user = await cookieUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const url = new URL(req.url);

    // Extract query params for pagination, search, sorting
    const search = url.searchParams.get("search") || "";
    const page = Number(url.searchParams.get("page") || 1);
    const perPage = Number(url.searchParams.get("perPage") || 10);
    const sortBy = (url.searchParams.get("sortBy") as "name" | "createdAt" | "studentCount") || "name";
    const sortOrder = (url.searchParams.get("sortOrder") as "asc" | "desc") || "asc";

    // Base filter: only classes belonging to user's school
    const where: any = { schoolId: user.schoolId };
    if (search) {
      // Case-insensitive search on class name
      where.name = { contains: search, mode: "insensitive" };
    }

    // Count total classes matching filter (for pagination)
    const total = await prisma.class.count({ where });

    // Fetch classes with students included, pagination, and sorting
    const classes = await prisma.class.findMany({
      where,
      include: { students: true }, // include students for UI purposes
      skip: (page - 1) * perPage,  // pagination offset
      take: perPage,               // pagination limit
      orderBy:
        sortBy === "studentCount"
          ? { students: { _count: sortOrder } } // special case: sort by number of students
          : { [sortBy]: sortOrder },            // normal sort by field
    });

    // Return classes and pagination info
    return NextResponse.json({ classes, total, page, perPage });
  } catch (err: any) {
    // Catch-all server error
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ------------------------- POST: Create class -------------------------
export async function POST(req: NextRequest) {
  // Authenticate user
  const user = await cookieUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Role-based access control: only ADMIN or PRINCIPAL can create
  if (![Role.ADMIN, Role.PRINCIPAL].includes(user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    // Parse request body and validate
    const body = await req.json();
    const data = classCreateSchema.parse(body);

    // Create new class scoped to user's school and creator
    const newClass = await prisma.class.create({
      data: {
        name: data.name,
        schoolId: user.schoolId,
        createdById: user.id,
      },
      include: { students: true }, // include empty students array
    });

    // Return created class with 201 status
    return NextResponse.json(newClass, { status: 201 });
  } catch (err: any) {
    // Zod validation error handling
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.flatten() }, { status: 400 });

    // Generic server error
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
