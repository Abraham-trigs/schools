// app/api/users/route.ts
// Purpose: User creation and listing API with integrated Staff creation, school context, hashed passwords, Zod validation, and staff info included.

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { userCreateSchema, staffRoles } from "@/lib/validation/userSchemas";
import { cookieUser } from "@/lib/cookieUser";
import { z } from "zod";
import bcrypt from "bcryptjs";

// ------------------- Zod schemas -------------------
const userQuerySchema = z.object({
  search: z.string().optional(),
  role: z.string().optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
});

// ------------------- Design reasoning -------------------
// - Creates User and Staff (if role matches staffRoles) atomically with $transaction.
// - Passwords hashed for security.
// - Includes staff info in GET response for seamless frontend use.
// - School context ensures users only manage their own school data.
// - Zod validates query params and request body.
// - Supports pagination and search for large datasets.

// ------------------- Structure -------------------
// Exports:
// POST -> create user + optional staff
// GET -> list users scoped to school, with staff info, search, and pagination

export async function POST(req: Request) {
  try {
    const currentUser = await cookieUser();
    if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = userCreateSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email: parsed.email } });
    if (existing) return NextResponse.json({ error: "Email already in use" }, { status: 400 });

    const hashedPassword = await bcrypt.hash(parsed.password, 12);

    const userData = {
      name: parsed.name,
      email: parsed.email,
      password: hashedPassword,
      role: parsed.role,
      busId: parsed.role === "TRANSPORT" ? parsed.busId : null,
      schoolId: currentUser.school?.id,
    };

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({ data: userData });

      if (staffRoles.includes(parsed.role)) {
        await tx.staff.create({
          data: {
            userId: createdUser.id,
            role: parsed.role,
            schoolId: currentUser.school?.id,
          },
        });
      }

      return createdUser;
    });

    // Include staff info in response
    const userWithStaff = await prisma.user.findUnique({
      where: { id: user.id },
      include: { staff: true },
    });

    return NextResponse.json(userWithStaff, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server error" }, { status: 400 });
  }
}

export async function GET(req: Request) {
  try {
    const currentUser = await cookieUser();
    if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const queryParsed = userQuerySchema.parse({
      search: url.searchParams.get("search") || undefined,
      role: url.searchParams.get("role") || undefined,
      page: url.searchParams.get("page") || undefined,
      limit: url.searchParams.get("limit") || undefined,
    });

    const skip = (queryParsed.page - 1) * queryParsed.limit;

    const where: any = { schoolId: currentUser.school?.id };
    if (queryParsed.role) where.role = queryParsed.role;
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
        include: { staff: true },
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
    return NextResponse.json({ error: err.message || "Server error" }, { status: 400 });
  }
}
