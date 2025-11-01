import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cookieUser } from "@/lib/cookieUser";
import { z } from "zod";

// Validation schema for creating a student
const studentSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6), // already hashed
});

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await cookieUser(req);
  if (!user)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const students = await prisma.student.findMany({
    where: { classId: params.id },
    include: { user: true, class: true },
  });

  return NextResponse.json({ students }); // ✅ wrap in object for consistency
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await cookieUser(req);
  if (!user)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = studentSchema.parse(body);

    const newStudent = await prisma.student.create({
      data: {
        name: data.name,
        email: data.email,
        password: data.password, // already hashed
        classId: params.id,
      },
    });

    return NextResponse.json({
      message: "Student created successfully",
      student: newStudent,
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { message: err.message || "Failed to add student" },
      { status: 400 }
    );
  }
}
