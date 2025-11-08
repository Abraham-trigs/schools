// app/api/classes/[id]/route.ts
// Purpose: Handle single class operations (fetch, update, delete) with nested students and attendance, role-based auth, and full validation.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookieUser } from "@/lib/cookieUser";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

// ------------------------- Schemas -------------------------
const classUpdateSchema = z.object({
  name: z.string().min(1, "Class name is required"),
});

// ------------------------- Helpers -------------------------
const jsonError = (payload: { error: string | Record<string, string[]> }, status = 400) =>
  NextResponse.json(payload, { status });

async function resolveParams(context: { params: any }) {
  const params = context.params;
  if (!params?.id) throw new Error("Missing class id");
  return params.id;
}

// ------------------------- GET: Single class with students -------------------------
export async function GET(req: NextRequest, context: { params: any }) {
  try {
    const classId = await resolveParams(context);
    const user = await cookieUser(req);
    if (!user) return jsonError({ error: "Unauthorized" }, 401);

    const cls = await prisma.class.findFirst({
      where: { id: classId, schoolId: user.schoolId },
      include: {
        students: {
          include: {
            user: true,
            parents: true,
            exams: true,
            transactions: true,
            attendances: true,
          },
        },
        staff: { include: { user: true } },
      },
    });

    if (!cls) return jsonError({ error: "Class not found" }, 404);
    return NextResponse.json({ data: cls });
  } catch (err: any) {
    console.error("GET /api/classes/[id] error:", err);
    return jsonError({ error: err.message || "Failed to fetch class" }, 500);
  }
}

// ------------------------- PUT: Update class -------------------------
export async function PUT(req: NextRequest, context: { params: any }) {
  try {
    const classId = await resolveParams(context);
    const user = await cookieUser(req);
    if (!user) return jsonError({ error: "Unauthorized" }, 401);
    if (![Role.ADMIN, Role.PRINCIPAL].includes(user.role))
      return jsonError({ error: "Forbidden" }, 403);

    const body = await req.json();
    const parsed = classUpdateSchema.safeParse(body);
    if (!parsed.success) return jsonError({ error: parsed.error.flatten().fieldErrors }, 400);

    const updatedClass = await prisma.class.update({
      where: { id: classId, schoolId: user.schoolId },
      data: { name: parsed.data.name },
    });

    return NextResponse.json({ data: updatedClass });
  } catch (err: any) {
    console.error("PUT /api/classes/[id] error:", err);
    return jsonError({ error: err.message || "Failed to update class" }, 500);
  }
}

// ------------------------- DELETE: Remove class -------------------------
export async function DELETE(req: NextRequest, context: { params: any }) {
  try {
    const classId = await resolveParams(context);
    const user = await cookieUser(req);
    if (!user) return jsonError({ error: "Unauthorized" }, 401);
    if (![Role.ADMIN, Role.PRINCIPAL].includes(user.role))
      return jsonError({ error: "Forbidden" }, 403);

    const deleted = await prisma.class.deleteMany({
      where: { id: classId, schoolId: user.schoolId },
    });

    if (deleted.count === 0) return jsonError({ error: "Class not found" }, 404);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/classes/[id] error:", err);
    return jsonError({ error: err.message || "Failed to delete class" }, 500);
  }
}

/* Design reasoning:
- GET fetches class and nested students fully normalized for the store.
- PUT enforces role-based update and validates input with Zod.
- DELETE ensures scoped removal by schoolId and prevents accidental deletions.
Structure:
- GET: single class with nested students and staff.
- PUT: update class name.
- DELETE: delete class safely.
Implementation guidance:
- Wire GET to fetchClassById in store.
- Wire PUT to updateClass and DELETE to deleteClass.
Scalability insight:
- Can extend GET to include attendance by date filter, subjects, or other relations without changing store interface.
*/
