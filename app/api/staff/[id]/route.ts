// app/api/staff/[id]/route.ts
// Purpose: Item route for staff management — get, update, delete staff scoped by schoolId with full validation and transactional updates.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { cookieUser } from "@/lib/cookieUser";

// ---------------- Types ----------------
interface StaffUpdateRequest {
  name?: string;
  email?: string;
  password?: string;
  position?: string | null;
  departmentId?: string | null;
  classId?: string | null;
  salary?: number | null;
  subjects?: string[];
  hireDate?: string | null;
}

// ---------------- Validation Schema ----------------
const staffUpdateSchema = z.object({
  name: z.string().optional(),
  email: z.string().email("Invalid email").optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  position: z.string().optional().nullable(),
  departmentId: z.string().optional().nullable(),
  classId: z.string().optional().nullable(),
  salary: z.preprocess(val => (val === "" ? null : Number(val)), z.number().nullable().optional()),
  subjects: z.array(z.string()).optional(),
  hireDate: z.preprocess(val => (val ? new Date(val as string) : null), z.date().nullable().optional()),
});

// ---------------- GET ----------------
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await cookieUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const staff = await prisma.staff.findFirst({
    where: { id: params.id, schoolId: user.schoolId },
    include: { user: true, class: true, department: true, subjects: true },
  });

  if (!staff) return NextResponse.json({ error: "Staff not found" }, { status: 404 });
  return NextResponse.json(staff);
}

// ---------------- PUT ----------------
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await cookieUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body: StaffUpdateRequest = await req.json();
    const data = staffUpdateSchema.parse(body);

    return await prisma.$transaction(async tx => {
      const staff = await tx.staff.findFirst({
        where: { id: params.id, schoolId: user.schoolId },
        include: { user: true },
      });
      if (!staff) return NextResponse.json({ error: "Staff not found" }, { status: 404 });

      // Update user
      if (data.name || data.email || data.password) {
        await tx.user.update({
          where: { id: staff.userId },
          data: {
            name: data.name ?? undefined,
            email: data.email ?? undefined,
            password: data.password ? await bcrypt.hash(data.password, 10) : undefined,
          },
        });
      }

      // Update staff fields
      const updatedStaff = await tx.staff.update({
        where: { id: staff.id },
        data: {
          position: data.position ?? undefined,
          departmentId: data.departmentId ?? undefined,
          classId: data.classId ?? undefined,
          salary: data.salary ?? undefined,
          hireDate: data.hireDate ?? undefined,
          subjects: data.subjects
            ? {
                deleteMany: {}, // remove old subjects
                create: data.subjects.map(name => ({
                  subject: { connectOrCreate: { where: { name }, create: { name } } },
                })),
              }
            : undefined,
        },
        include: { user: true, class: true, department: true, subjects: true },
      });

      return NextResponse.json(updatedStaff);
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.flatten() }, { status: 400 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ---------------- DELETE ----------------
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await cookieUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const deleted = await prisma.staff.deleteMany({
    where: { id: params.id, schoolId: user.schoolId },
  });

  if (deleted.count === 0) return NextResponse.json({ error: "Staff not found" }, { status: 404 });

  return NextResponse.json({ message: "Staff deleted successfully" });
}

/* 
Design reasoning → Ensures all staff operations are scoped by the requesting user's schoolId, preserving multi-tenant data safety. Uses transactions to maintain consistency between staff, user, and subjects. Validates and normalizes inputs for safe updates. 

Structure → Exports GET, PUT, DELETE; GET fetches staff by schoolId, PUT updates staff+user+subjects in a transaction, DELETE removes staff safely.

Implementation guidance → Drop into Next.js API folder. Replace existing route. Frontend should call endpoints with authenticated user cookie; PUT payload must match staffUpdateSchema.

Scalability insight → Easy to extend with attendance, finances, or other relations; additional role-based access or multi-school support can be added without breaking existing logic.
*/
