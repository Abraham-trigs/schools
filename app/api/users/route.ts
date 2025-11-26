// app/api/users/route.ts
// Purpose: User-only API (students) using SchoolAccount wrapper
// Handles creation, listing, pagination, search, with school scoping

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SchoolAccount } from "@/lib/schoolAccount.ts";
import bcrypt from "bcryptjs";
import { z } from "zod";

// ------------------- Zod schemas -------------------
const userQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
});

const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.string().default("STUDENT"),
});

// ------------------- POST: Create User -------------------
export async function POST(req: NextRequest) {
  try {
    const schoolAcc = await SchoolAccount.init();
    if (!schoolAcc)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = createUserSchema.parse(body);

    const existing = await prisma.user.findUnique({
      where: { email: parsed.email },
    });
    if (existing)
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });

    const hashedPassword = await bcrypt.hash(parsed.password, 12);

    const userData = {
      name: parsed.name,
      email: parsed.email,
      password: hashedPassword,
      role: parsed.role,
      schoolId: schoolAcc.schoolId, // automatic school scoping
    };

    const createdUser = await prisma.user.create({ data: userData });

    return NextResponse.json(createdUser, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: err.errors }, { status: 400 });
    console.error("POST /api/users error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

// ------------------- GET: List Users -------------------
export async function GET(req: NextRequest) {
  try {
    const schoolAcc = await SchoolAccount.init();
    if (!schoolAcc)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const queryParsed = userQuerySchema.parse({
      search: url.searchParams.get("search") || undefined,
      page: url.searchParams.get("page") || undefined,
      limit: url.searchParams.get("limit") || undefined,
    });

    const skip = (queryParsed.page - 1) * queryParsed.limit;

    const where: any = { schoolId: schoolAcc.schoolId };
    if (queryParsed.search) {
      where.OR = [
        { name: { contains: queryParsed.search, mode: "insensitive" } },
        { email: { contains: queryParsed.search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        skip,
        take: queryParsed.limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      data: users,
      pagination: {
        total,
        page: queryParsed.page,
        limit: queryParsed.limit,
        pages: Math.ceil(total / queryParsed.limit),
      },
    });
  } catch (err: any) {
    console.error("GET /api/users error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

