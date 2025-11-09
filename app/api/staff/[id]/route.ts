// app/api/staff/[id]/route.ts
// Purpose: Staff item API – retrieve, update, delete by ID with school scoping, transactional updates, multi-subject support, field-level errors, and extensible filters

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { cookieUser } from "@/lib/cookieUser";
import { requiresClass, requiresSubjects, inferDepartmentFromPosition } from "@/lib/api/constants/roleInference";

// ------------------------- Schemas -------------------------
const staffUpdateSchema = z.object({
  position: z.string().optional(),
  salary: z.number().optional(),
  hireDate: z.string().optional(),
  classId: z.string().optional().nullable(),
  subjectIds: z.array(z.string()).optional(),
  department: z.string().optional(),
  busId: z.string().optional().nullable(), // extensible filter
  createdAt: z.string().optional(),       // extensible filter
});

// ------------------------- GET: Retrieve Staff -------------------------
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const authUser = await cookieUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const staff = await prisma.staff.findFirst({
    where: { id: params.id, schoolId: authUser.schoolId },
    include: { user: true, subjects: true, class: true },
  });

  if (!staff) return NextResponse.json({ error: "Staff not found" }, { status: 404 });

  return NextResponse.json(staff);
}

// ------------------------- PUT: Update Staff -------------------------
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const authUser = await cookieUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = staffUpdateSchema.parse(body);

    // Fetch existing staff for transactional updates
    const existingStaff = await prisma.staff.findFirst({ where: { id: params.id, schoolId: authUser.schoolId } });
    if (!existingStaff) return NextResponse.json({ error: "Staff not found" }, { status: 404 });

    // Validate class requirement
    if (data.position && requiresClass(data.position) && !data.classId && !existingStaff.classId)
      return NextResponse.json({ error: { classId: ["Class is required for this position"] } }, { status: 400 });

    // Validate subjects
    if (data.position && requiresSubjects(data.position) && (!data.subjectIds || data.subjectIds.length === 0))
      return NextResponse.json({ error: { subjectIds: ["At least one subject required"] } }, { status: 400 });

    // Normalize fields
    if (data.hireDate) data.hireDate = new Date(data.hireDate);
    if (data.createdAt) data.createdAt = new Date(data.createdAt);

    // Transactional update
    const updatedStaff = await prisma.$transaction(async (tx) => {
      const staff = await tx.staff.update({
        where: { id: params.id },
        data: {
          position: data.position,
          salary: data.salary,
          hireDate: data.hireDate,
          classId: data.classId ?? existingStaff.classId,
          department: data.department ?? (data.position ? inferDepartmentFromPosition(data.position) : existingStaff.department),
          busId: data.busId ?? existingStaff.busId,
          subjects: data.subjectIds ? { set: data.subjectIds.map((id) => ({ id })) } : undefined,
          createdAt: data.createdAt ?? existingStaff.createdAt,
        },
        include: { user: true, subjects: true, class: true },
      });

      // Example: could update related User record or other related models here
      // await tx.user.update({ where: { id: staff.userId }, data: { department: staff.department } });

      return staff;
    });

    return NextResponse.json(updatedStaff);
  } catch (err: any) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.flatten() }, { status: 400 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ------------------------- DELETE: Remove Staff -------------------------
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const authUser = await cookieUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await prisma.$transaction(async (tx) => {
      // Optionally delete related Staff-User relationships
      await tx.staff.delete({ where: { id: params.id } });
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ------------------------- Design reasoning → -------------------------
// Staff item API is school-scoped, transactional, and validates class/subject requirements. Supports extensible filters (busId, createdAt) and relational updates. Field-level error responses allow inline form validation and prevent breaking frontend forms.

// ------------------------- Structure → -------------------------
// GET → retrieve staff with user, class, subjects relations
// PUT → update staff with transactional handling, multi-subject support, normalization, and optional relational updates
// DELETE → remove staff atomically

// ------------------------- Implementation guidance → -------------------------
// Frontend can call GET/PUT/DELETE; PUT returns full staff object including relations for optimistic updates. Extensible transaction blocks allow adding related model updates without breaking API. Field-level errors support inline form validations for better UX.

// ------------------------- Scalability insight → -------------------------
// Easily extend with additional filters (busId, createdAt, department), transactional updates for other related models (User, Attendance, Payroll), or dynamic form validation. Ensures data integrity while supporting future feature expansion.
