// app/api/staff/[id]/route.ts
// Purpose: Item route for staff management — get, update, delete staff safely with full validation and transactional updates.

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

  const staff = await prisma.staff.findUnique({
    where: { id: params.id },
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
      const staff = await tx.staff.findUnique({ where: { id: params.id }, include: { user: true } });
      if (!staff) return NextResponse.json({ error: "Staff not found" }, { status: 404 });

      // Update user
      if (data.name || data.email || data.password) {
        await tx.user.update({
          where: { id: staff.userId },
          data: {
            name: data.name,
            email: data.email,
            password: data.password ? await bcrypt.hash(data.password, 10) : undefined,
          },
        });
      }

      // Update staff fields
      const updatedStaff = await tx.staff.update({
        where: { id: params.id },
        data: {
          position: data.position ?? undefined,
          departmentId: data.departmentId ?? undefined,
          classId: data.classId ?? undefined,
          salary: data.salary ?? undefined,
          hireDate: data.hireDate ?? undefined,
          subjects: data.subjects ? {
            deleteMany: {}, // remove old subjects
            create: data.subjects.map(name => ({ subject: { connectOrCreate: { where: { name }, create: { name } } } })),
          } : undefined,
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

  return await prisma.$transaction(async tx => {
    const staff = await tx.staff.findUnique({ where: { id: params.id } });
    if (!staff) return NextResponse.json({ error: "Staff not found" }, { status: 404 });

    await tx.user.delete({ where: { id: staff.userId } });
    await tx.staff.delete({ where: { id: params.id } });

    return NextResponse.json({ message: "Staff deleted successfully" });
  });
}

/* 
Design reasoning → Structure → Implementation guidance → Scalability insight
- Handles transactional updates for staff + user + subjects to maintain DB integrity.
- GET fetches full staff info; PUT handles multi-subject updates safely; DELETE cleans up both user and staff.
- Input validation via Zod ensures normalized types; transaction ensures atomic updates.
- Supports future extensions (e.g., attendance, finances, additional relations) without altering core structure.
*/
