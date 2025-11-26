// app/api/library/staff/route.ts
// Handles listing and creating LibraryStaff with auth, validation, role & department inference, and school scope

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { SchoolAccount } from "@/lib/schoolAccount";
import bcrypt from "bcryptjs";

// Validation schema
const libraryStaffSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  position: z.string().optional().nullable(),
  departmentId: z.string().optional().nullable(),
  password: z.string().min(6),
});

// ===================== GET Library Staff =====================
export async function GET(req: NextRequest) {
  const schoolAccount = await SchoolAccount.init();
  if (!schoolAccount) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const search = url.searchParams.get("search") || "";
  const page = Number(url.searchParams.get("page") || 1);
  const perPage = Number(url.searchParams.get("perPage") || 10);

  const where: any = { schoolId: schoolAccount.schoolId };
  if (search) {
    where.OR = [
      { user: { name: { contains: search, mode: "insensitive" } } },
      { user: { email: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [staffList, total] = await prisma.$transaction([
    prisma.libraryStaff.findMany({
      where,
      include: { user: true, department: true },
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { createdAt: "desc" },
    }),
    prisma.libraryStaff.count({ where }),
  ]);

  return NextResponse.json({ staffList, total, page });
}

// ===================== POST Create Library Staff =====================
export async function POST(req: NextRequest) {
  const schoolAccount = await SchoolAccount.init();
  if (!schoolAccount) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = libraryStaffSchema.parse(body);

    const hashedPassword = await bcrypt.hash(data.password, 10);

    return await prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({ where: { email: data.email } });
      if (existingUser) return NextResponse.json({ error: "Email exists" }, { status: 400 });

      const newUser = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashedPassword,
          role: "LIBRARIAN",
          schoolId: schoolAccount.schoolId,
        },
      });

      const newStaff = await tx.libraryStaff.create({
        data: {
          userId: newUser.id,
          position: data.position ?? "Librarian",
          departmentId: data.departmentId ?? null,
        },
        include: { user: true, department: true },
      });

      return NextResponse.json(newStaff, { status: 201 });
    });
  } catch (err: any) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: err.flatten() }, { status: 400 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
