// app/api/library/[id]/route.ts
// Handles update/delete of Book or LibraryStaff with auth, validation, and department constraints.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { cookieUser } from "@/lib/cookieUser";

const bookUpdateSchema = z.object({
  title: z.string().optional(),
  isbn: z.string().optional(),
  authorId: z.string().optional(),
  categoryId: z.string().optional().nullable(),
  totalCopies: z.preprocess((v) => (v ? Number(v) : undefined), z.number().min(1).optional()),
});

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const user = await cookieUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = bookUpdateSchema.parse(body);

    const book = await prisma.book.findUnique({ where: { id: params.id } });
    if (!book) return NextResponse.json({ error: "Book not found" }, { status: 404 });

    if (book.schoolId !== user.schoolId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const updated = await prisma.book.update({
      where: { id: params.id },
      data: { ...data, available: data.totalCopies ?? book.available },
      include: { author: true, category: true },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.flatten() }, { status: 400 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = await cookieUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const book = await prisma.book.findUnique({ where: { id: params.id } });
    if (!book) return NextResponse.json({ error: "Book not found" }, { status: 404 });
    if (book.schoolId !== user.schoolId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.book.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
