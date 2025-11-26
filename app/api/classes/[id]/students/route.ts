// app/api/classes/[id]/students/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SchoolAccount } from "@/lib/schoolAccount";
import { z } from "zod";

// Validation schema for creating a student
const studentSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6), // already hashed
});

// -------------------- GET Students by Class --------------------
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const schoolAccount = await SchoolAccount.init();
  if (!schoolAccount)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const students = await prisma.student.findMany({
    where: {
      classId: params.id,
      class: { schoolId: schoolAccount.schoolId }, // enforce school scoping
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      class: { select: { id: true, name: true, grade: true } },
    },
  });

  return NextResponse.json({ students });
}

// -------------------- POST Create Student in Class --------------------
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const schoolAccount = await SchoolAccount.init();
  if (!schoolAccount)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = studentSchema.parse(body);

    // Ensure the class belongs to the user's school
    const cls = await prisma.class.findFirst({
      where: { id: params.id, schoolId: schoolAccount.schoolId },
    });
    if (!cls)
      return NextResponse.json({ message: "Class not found" }, { status: 404 });

    const newStudent = await prisma.student.create({
      data: {
        name: data.name,
        email: data.email,
        password: data.password, // already hashed
        classId: params.id,
      },
    });

    return NextResponse.json(
      { message: "Student created successfully", student: newStudent },
      { status: 201 }
    );
  } catch (err: any) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: err.errors }, { status: 400 });

    return NextResponse.json(
      { message: err.message || "Failed to add student" },
      { status: 400 }
    );
  }
}
