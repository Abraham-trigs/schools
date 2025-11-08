// app/api/students/[id]/route.ts
// Purpose: Item route for Student - get, update (PATCH), delete

"use server";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookieUser } from "@/lib/cookieUser";
import { Role } from "@prisma/client";
import { z } from "zod";
import bcrypt from "bcryptjs";

// ------------------------- PATCH schema -------------------------
const studentUpdateSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  classId: z.string().nullable().optional(),
});

// ------------------------- Helper -------------------------
async function resolveParams({ params }: { params: { id: string } }) {
  return params.id;
}

// ------------------------- GET: single student -------------------------
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const studentId = await resolveParams({ params });
  const user = await cookieUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const student = await prisma.student.findFirst({
    where: { id: studentId, schoolId: user.schoolId },
    include: {
      user: true,
      class: true,
      parents: true,
      exams: true,
      transactions: true,
      attendances: { orderBy: { date: "desc" }, take: 30 },
    },
  });

  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });
  return NextResponse.json({ data: student });
}

// ------------------------- PATCH: update student -------------------------
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const studentId = await resolveParams({ params });
  const user = await cookieUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (![Role.ADMIN, Role.PRINCIPAL, Role.TEACHER].includes(user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const data = studentUpdateSchema.parse(body);

    const userData: any = {};
    if (data.name) userData.name = data.name;
    if (data.email) userData.email = data.email;
    if (data.password) userData.password = await bcrypt.hash(data.password, 10);

    const updateData: any = {};
    if ("classId" in data) updateData.classId = data.classId;

    const updatedStudent = await prisma.$transaction(async (tx) => {
      if (Object.keys(updateData).length > 0)
        await tx.student.update({ where: { id: studentId }, data: updateData });

      if (Object.keys(userData).length > 0) {
        const student = await tx.student.findUnique({ where: { id: studentId } });
        if (!student) throw new Error("Student not found during update");
        await tx.user.update({ where: { id: student.userId }, data: userData });
      }

      return tx.student.findUnique({
        where: { id: studentId },
        include: {
          user: true,
          class: true,
          parents: true,
          exams: true,
          transactions: true,
          attendances: true,
        },
      });
    });

    return NextResponse.json({ data: updatedStudent });
  } catch (err: any) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.flatten() }, { status: 400 });
    return NextResponse.json({ error: err.message || "Unexpected error" }, { status: 500 });
  }
}

// ------------------------- DELETE student -------------------------
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const studentId = await resolveParams({ params });
  const user = await cookieUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (![Role.ADMIN, Role.PRINCIPAL].includes(user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const deleted = await prisma.student.deleteMany({
    where: { id: studentId, schoolId: user.schoolId },
  });

  if (deleted.count === 0)
    return NextResponse.json({ error: "Student not found" }, { status: 404 });

  return NextResponse.json({ data: "Student deleted" });
}

/**
 * -------------------------
 * Design reasoning → Full item route for getting, updating, and deleting a student safely with transactions.
 * Structure → GET + PATCH + DELETE
 * Implementation guidance → Pass studentId from route params; PATCH allows optional updates; DELETE cascades user deletion.
 * Scalability insight → Extend update schema for additional fields; add role-based conditional logic; transaction ensures consistency.
 */
