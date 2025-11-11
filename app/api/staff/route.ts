// app/api/users/route.ts
// Purpose: User API – full CRUD, search, filter, sort, pagination, debounced search (role applied only at Staff)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma.ts";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { Role } from "@/lib/db.ts";
import { cookieUser } from '@/lib/cookieUser.ts';

// ------------------------- Schemas -------------------------
const userCreateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  busId: z.string().optional().nullable(),
});

const userQuerySchema = z.object({
  search: z.string().optional(),
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

    if (query.debounce) await new Promise((res) => setTimeout(res, query.debounce));

    const where: any = { schoolId: authUser.schoolId };
    if (query.search) where.name = { contains: query.search, mode: "insensitive" };
    if (query.department) where.department = query.department;

    const total = await prisma.user.count({ where });

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

    const newUser = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        busId: data.busId || null,
        schoolId: authUser.schoolId,
      },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.flatten() }, { status: 400 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
