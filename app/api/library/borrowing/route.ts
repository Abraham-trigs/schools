// app/api/library/borrowing/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db.ts";
import { z } from "zod";
import { SchoolAccount } from "@/lib/schoolAccount.ts";

const borrowingSchema = z.object({
  studentId: z.string().min(1),
  bookId: z.string().min(1),
  dueDate: z.preprocess(val => new Date(val as string), z.date()),
});

// =====================
// GET: List borrowings
// =====================
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
      { student: { user: { name: { contains: search, mode: "insensitive" } } } },
      { book: { title: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [borrowList, total] = await prisma.$transaction([
    prisma.borrowing.findMany({
      where,
      include: {
        student: { include: { user: true } },
        book: true,
        librarian: { include: { user: true } },
      },
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { createdAt: "desc" },
    }),
    prisma.borrowing.count({ where }),
  ]);

  return NextResponse.json({ borrowList, total, page });
}

// =====================
// POST: Create borrowing
// =====================
export async function POST(req: NextRequest) {
  const schoolAccount = await SchoolAccount.init();
  if (!schoolAccount) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = borrowingSchema.parse(body);

    const book = await prisma.book.findUnique({ where: { id: data.bookId } });
    if (!book) return NextResponse.json({ error: "Book not found" }, { status: 404 });
    if (book.quantity <= 0) return NextResponse.json({ error: "Book not available" }, { status: 400 });

    const borrowing = await prisma.borrowing.create({
      data: {
        studentId: data.studentId,
        bookId: data.bookId,
        dueDate: data.dueDate,
        schoolId: schoolAccount.schoolId,
        librarianId: schoolAccount.info.id,
      },
      include: {
        student: { include: { user: true } },
        book: true,
        librarian: { include: { user: true } },
      },
    });

    await prisma.book.update({ where: { id: data.bookId }, data: { quantity: book.quantity - 1 } });

    return NextResponse.json(borrowing, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.flatten() }, { status: 400 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
