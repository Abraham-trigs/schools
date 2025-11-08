// app/api/staff/[id]/route.ts
// Purpose: Item route for Staff - get, update (PATCH), delete with transaction-safe updates and role checks

"use server";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookieUser } from "@/lib/cookieUser";
import { Role } from "@prisma/client";
import { z } from "zod";
import bcrypt from "bcryptjs";

const staffUpdateSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  position: z.string().optional(),
  departmentId: z.string().nullable().optional(),
  classId: z.string().nullable().optional(),
  salary: z.preprocess(
    (val) => (val === "" ? null : Number(val)),
    z.number().nullable().optional()
  ),
  hireDate: z.preprocess(
    (val) => (val ? new Date(val as string) : undefined),
    z.date().optional()
  ),
  subjects: z.array(z.string()).optional(),
});

// ------------------------- Helper -------------------------
async function resolveParams({ params }: { params: { id: string } }) {
  return params.id;
}

// ------------------------- GET staff by id -------------------------
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const staffId = await resolveParams({ params });
  const user = await cookieUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const staff = await prisma.staff.findFirst({
    where: { id: staffId, schoolId: user.schoolId },
    include: { user: true, class: true, department: true, subjects: true, attendances: true, financesRecorded: true },
  });

  if (!staff) return NextResponse.json({ error: "Staff not found" }, { status: 404 });
  return NextResponse.json({ data: staff });
}

// ------------------------- PATCH: update staff -------------------------
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const staffId = await resolveParams({ params });
  const user = await cookieUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (![Role.ADMIN, Role.PRINCIPAL, Role.HR].includes(user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const data = staffUpdateSchema.parse(body);

    return await prisma.$transaction(async (tx) => {
      const staff = await tx.staff.findUnique({ where: { id: staffId } });
      if (!staff) throw new Error("Staff not found during update");

      const userData: any = {};
      if (data.name) userData.name = data.name;
      if (data.email) userData.email = data.email;
      if (data.password) userData.password = await bcrypt.hash(data.password, 10);

      const staffData: any = {};
      if (data.position) staffData.position = data.position;
      if ("departmentId" in data) staffData.departmentId = data.departmentId;
      if ("classId" in data) staffData.classId = data.classId;
      if ("salary" in data) staffData.salary = data.salary;
      if ("hireDate" in data) staffData.hireDate = data.hireDate;

      if ("subjects" in data) {
        staffData.subjects = {
          set: data.subjects.map((id) => ({ id })),
        };
      }

      if (Object.keys(userData).length > 0) {
        await tx.user.update({ where: { id: staff.userId }, data: userData });
      }

      const updatedStaff = await tx.staff.update({
        where: { id: staffId },
        data: staffData,
        include: { user: true, class: true, department: true, subjects: true, attendances: true, financesRecorded: true },
      });

      return NextResponse.json({ data: updatedStaff });
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.flatten() }, { status: 400 });
    console.error("PATCH /api/staff/[id] failed:", err);
    return NextResponse.json({ error: err.message || "Unexpected error" }, { status: 500 });
  }
}

// ------------------------- DELETE staff -------------------------
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const staffId = await resolveParams({ params });
  const user = await cookieUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (![Role.ADMIN, Role.PRINCIPAL].includes(user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const deleted = await prisma.staff.deleteMany({
    where: { id: staffId, schoolId: user.schoolId },
  });

  if (deleted.count === 0)
    return NextResponse.json({ error: "Staff not found" }, { status: 404 });

  return NextResponse.json({ data: "Staff deleted" });
}

/* Design reasoning → Transactional updates with user + staff consistency, role-based access, subjects delta update, and safe deletion.
Structure → GET, PATCH, DELETE with Prisma transactions and relational includes.
Implementation guidance → Only authorized roles can update/delete; PATCH normalizes inputs and handles subjects.
Scalability insight → Extend PATCH schema for extra fields, handle more relations, or add batch operations without breaking current API.
*/
