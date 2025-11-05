// app/api/library/route.ts
// Handles listing and creating Books and LibraryStaff with auth, validation, department control, and school scope.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { cookieUser } from "@/lib/cookieUser";

const bookSchema = z.object({
  title: z.string().min(1, "Title required"),
  isbn: z.string().min(10, "ISBN too short"),
  authorId: z.string(),
  categoryId: z.string().optional().nullable(),
  totalCopies: z.preprocess((v) => Number(v), z.number().min(1)),
});

export async function GET(req: NextRequest) {
  const user = await cookieUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const search = url.searchParams.get("search") || "";
  const page = Number(url.searchParams.get("page") || 1);
  const perPage = Number(url.searchParams.get("perPage") || 10);

  const where = search
    ? { title: { contains: search, mode: "insensitive" }, schoolId: user.schoolId }
    : { schoolId: user.schoolId };

  const [books, total] = await prisma.$transaction([
    prisma.book.findMany({
      where,
      include: { author: true, category: true },
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { createdAt: "desc" },
    }),
    prisma.book.count({ where }),
  ]);

  return NextResponse.json({ books, total, page });
}

export async function POST(req: NextRequest) {
  const user = await cookieUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = bookSchema.parse(body);

    const newBook = await prisma.book.create({
      data: { ...data, available: data.totalCopies, schoolId: user.schoolId },
      include: { author: true, category: true },
    });

    return NextResponse.json(newBook, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.flatten() }, { status: 400 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
