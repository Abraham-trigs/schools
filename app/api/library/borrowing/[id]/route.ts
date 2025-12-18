// app/api/library/borrowing/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db.ts";
import { z } from "zod";
import { SchoolAccount } from "@/lib/schoolAccount.ts";

const updateSchema = z.object({ returned: z.boolean().optional() });

// =====================
// PUT: Update borrowing (return book)
// =====================
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const schoolAccount = await SchoolAccount.init();
  if (!schoolAccount) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = updateSchema.parse(body);

    const borrowing = await prisma.borrowing.findUnique({ where: { id: params.id }, include: { book: true } });
    if (!borrowing) return NextResponse.json({ error: "Borrowing not found" }, { status: 404 });
    if (borrowing.schoolId !== schoolAccount.schoolId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const updated = await prisma.borrowing.update({
      where: { id: params.id },
      data: {
        returned: data.returned ?? borrowing.returned,
        returnedAt: data.returned ? new Date() : null,
      },
      include: {
        student: { include: { user: true } },
        book: true,
        librarian: { include: { user: true } },
      },
    });

    // Increment book quantity if returned
    if (data.returned && !borrowing.returned) {
      await prisma.book.update({ where: { id: borrowing.bookId }, data: { quantity: borrowing.book.quantity + 1 } });
    }

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// =====================
// DELETE: Remove borrowing
// =====================
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const schoolAccount = await SchoolAccount.init();
  if (!schoolAccount) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const borrowing = await prisma.borrowing.findUnique({ where: { id: params.id }, include: { book: true } });
    if (!borrowing) return NextResponse.json({ error: "Borrowing not found" }, { status: 404 });
    if (borrowing.schoolId !== schoolAccount.schoolId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.$transaction([
      prisma.borrowing.delete({ where: { id: params.id } }),
      prisma.book.update({ where: { id: borrowing.bookId }, data: { quantity: borrowing.book.quantity + 1 } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
