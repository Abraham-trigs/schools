import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cookieUser } from "@/lib/cookieUser";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = await cookieUser(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const student = await prisma.student.findUnique({
    where: { id: params.id },
    include: { class: true },
  });

  if (!student) return NextResponse.json({ message: "Student not found" }, { status: 404 });
  return NextResponse.json(student.class);
}
