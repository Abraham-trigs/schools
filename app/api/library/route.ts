// app/api/library/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db.ts";
import { z } from "zod";
import { SchoolAccount } from "@/lib/schoolAccount.ts";

const bookSchema = z.object({
  title: z.string().min(1, "Title required"),
  isbn: z.string().min(10, "ISBN too short"),
  authorId: z.string(),
  categoryId: z.string().optional().nullable(),
  totalCopies: z.preprocess((v) => Number(v), z.number().min(1)),
});

// -------------------- GET list of books --------------------
export async function GET(req: NextRequest) {
  const schoolAccount = await SchoolAccount.init();
  if (!schoolAccount) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const search = url.searchParams.get("search") || "";
  const page = Number(url.searchParams.get("page") || 1);
  const perPage = Number(url.searchParams.get("perPage") || 10);

  const where: any = { schoolId: schoolAccount.schoolId };
  if (search) where.title = { contains: search, mode: "insensitive" };

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

  return NextResponse.json({ books, total, page, perPage });
}

// -------------------- POST create book --------------------
export async function POST(req: NextRequest) {
  const schoolAccount = await SchoolAccount.init();
  if (!schoolAccount) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = bookSchema.parse(body);

    const newBook = await prisma.book.create({
      data: { ...data, available: data.totalCopies, schoolId: schoolAccount.schoolId },
      include: { author: true, category: true },
    });

    return NextResponse.json(newBook, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.flatten() }, { status: 400 });
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
