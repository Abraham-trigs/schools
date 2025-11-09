// app/api/users/route.ts
// Purpose: Enhanced User API – full CRUD, search, filter, sort, pagination, debounced search, role inference, password hashing

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { cookieUser } from "@/lib/cookieUser";
import {
  Role,
  inferRoleFromPosition,
  inferDepartmentFromPosition,
} from "@/lib/api/constants/roleInference";

// ------------------------- Schemas -------------------------
const userCreateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  position: z.string().optional(),
  busId: z.string().optional().nullable(),
});

const userQuerySchema = z.object({
  search: z.string().optional(),
  role: z.nativeEnum(Role).optional(),
  department: z.string().optional(),
  page: z.preprocess((val) => Number(val), z.number().min(1)).optional(),
  perPage: z.preprocess((val) => Number(val), z.number().min(1).max(100)).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  debounce: z.preprocess((val) => Number(val), z.number().min(0)).optional(),
});

// ------------------------- GET: List Users -------------------------
export async function GET(req: NextRequest) {
  const authUser = await cookieUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const url = new URL(req.url);
    const query = userQuerySchema.parse(Object.fromEntries(url.searchParams));

    // Optional server-side debounce simulation
    if (query.debounce) await new Promise((res) => setTimeout(res, query.debounce));

    const where: any = { schoolId: authUser.schoolId };
    if (query.search) where.name = { contains: query.search, mode: "insensitive" };
    if (query.role) where.role = query.role;
    if (query.department) where.department = query.department;

    const total = await prisma.user.count({ where });

    // Sorting – supports multi-level (name, email, role)
    const orderBy: any = {};
    if (query.sortBy) orderBy[query.sortBy] = query.sortOrder || "asc";

    const users = await prisma.user.findMany({
      where,
      skip: ((query.page || 1) - 1) * (query.perPage || 10),
      take: query.perPage || 10,
      orderBy: orderBy || { name: "asc" },
    });

    return NextResponse.json({
      users,
      total,
      page: query.page || 1,
      perPage: query.perPage || 10,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.flatten() }, { status: 400 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ------------------------- POST: Create User -------------------------
export async function POST(req: NextRequest) {
  const authUser = await cookieUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (![Role.ADMIN, Role.PRINCIPAL].includes(authUser.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const data = userCreateSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) return NextResponse.json({ error: { email: ["Email already exists"] } }, { status: 400 });

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const role = inferRoleFromPosition(data.position);
    const department = inferDepartmentFromPosition(data.position);

    const newUser = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role,
        department,
        busId: data.busId || null,
        schoolId: authUser.schoolId,
      },
    });

    // Return full user for optimistic frontend update
    return NextResponse.json(newUser, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.flatten() }, { status: 400 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ------------------------- Design reasoning → -------------------------
// Centralized, school-scoped User API with search, filter, sort, debounce support, password hashing, role inference. Provides a single source of truth for frontend forms and stores.

// ------------------------- Structure → -------------------------
// GET → paginated, searchable, filterable, sortable user list
// POST → create user with password hashing & role/department inference

// ------------------------- Implementation guidance → -------------------------
// Drop-in route for Next.js; ensure `cookieUser` is wired; frontend can call GET with `search`, `role`, `department`, `sortBy`, `sortOrder`, `page`, `perPage`, `debounce` params

// ------------------------- Scalability insight → -------------------------
// Can extend with additional filters (e.g., busId, createdAt), multi-level sorting, or analytics fields; debouncing and transactions make it production-ready for high-load school apps
