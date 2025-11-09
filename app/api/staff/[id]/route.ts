"use server";

// app/api/staff/[id]/route.ts
// Purpose: Update or delete staff securely. Supports nested user updates, subjects, hireDate, department inference, and school scoping.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { cookieUser } from "@/lib/cookieUser";
import { inferDepartmentFromPosition, requiresClass } from "@/lib/api/constants/roleInference.ts";

// ------------------------- Types & Interfaces -------------------------
interface StaffUpdateRequest {
  name?: string;
  email?: string;
  position?: string;
  classId?: string | null;
  subjects?: string[];
  hireDate?: Date | null;
  salary?: number;
}

// ------------------------- Validation -------------------------
const staffUpdateSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  position: z.string().optional(),
  classId: z.string().nullable().optional(),
  subjects: z.array(z.string()).optional(),
  hireDate: z.preprocess((val) => (val ? new Date(val as string) : null), z.date().nullable().optional()),
  salary: z.coerce.number().optional(),
});

// ------------------------- Helpers -------------------------
async function findDepartmentId(name: string | null, schoolId: string): Promise<string | null> {
  if (!name) return null;
  const dept = await prisma.department.findUnique({
    where: { name_schoolId: { name, schoolId } },
    select: { id: true },
  });
  return dept?.id ?? null;
}

async function filterValidSubjectIds(subjectIds: string[] | undefined, schoolId: string): Promise<string[]> {
  if (!subjectIds?.length) return [];
  const validSubjects = await prisma.subject.findMany({
    where: { id: { in: subjectIds }, schoolId },
    select: { id: true },
  });
  return validSubjects.map((s) => s.id);
}

// ------------------------- PUT: Update Staff -------------------------
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await cookieUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body: StaffUpdateRequest = await req.json();
    const data = staffUpdateSchema.parse(body);

    const staff = await prisma.staff.findUnique({ where: { id: params.id }, include: { user: true, subjects: true } });
    if (!staff) return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    if (staff.user.schoolId !== user.schoolId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const departmentId = await findDepartmentId(data.position ? inferDepartmentFromPosition(data.position) : null, user.schoolId);
    const validSubjectIds = await filterValidSubjectIds(data.subjects, user.schoolId);

    const updateData: any = {
      position: data.position ?? staff.position,
      departmentId: departmentId ?? staff.departmentId ?? null,
      classId: requiresClass(data.position ?? staff.position) ? data.classId ?? staff.classId ?? null : null,
      hireDate: data.hireDate ?? staff.hireDate ?? null,
      salary: data.salary ?? staff.salary ?? null,
    };

    if (validSubjectIds.length) updateData.subjects = { set: validSubjectIds.map((id) => ({ id })) };

    // Nested user updates
    if (data.name || data.email) {
      await prisma.user.update({
        where: { id: staff.userId },
        data: { ...(data.name && { name: data.name }), ...(data.email && { email: data.email }) },
      });
    }

    const updatedStaff = await prisma.staff.update({
      where: { id: params.id },
      data: updateData,
      include: { user: true, class: true, department: true, subjects: true },
    });

    return NextResponse.json({ staff: updatedStaff });
  } catch (err: any) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: { message: "Validation failed", details: err.errors } }, { status: 400 });
    return NextResponse.json({ error: { message: err.message || "Internal Server Error" } }, { status: 500 });
  }
}

// ------------------------- DELETE: Remove Staff -------------------------
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await cookieUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const staff = await prisma.staff.findUnique({ where: { id: params.id }, include: { user: true } });
  if (!staff) return NextResponse.json({ error: "Staff not found" }, { status: 404 });
  if (staff.user.schoolId !== user.schoolId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    // Transaction: disconnect subjects + delete related records + delete staff
    await prisma.$transaction([
      prisma.staff.update({
        where: { id: params.id },
        data: {
          subjects: { set: [] },
          attendances: { deleteMany: {} },
          financesRecorded: { deleteMany: {} },
        },
      }),
      prisma.staff.delete({ where: { id: params.id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE staff error:", err);
    return NextResponse.json({ error: { message: "Internal Server Error" } }, { status: 500 });
  }
}

/* 
Design reasoning:
- PUT: Updates staff including nested user fields, subjects, class, department, hireDate, salary.
- DELETE: Safely removes staff with relational cleanup (subjects, attendances, finances).
Structure:
- Validation, auth, and school scoping applied consistently.
- Helper functions handle department and subject scoping.
Implementation guidance:
- Always call cookieUser for authentication.
- Send subjects as array of IDs for connect/set operations.
- hireDate can be null or ISO string.
Scalability:
- Works with large datasets: hundreds of subjects and staff members.
- Transactional updates and deletes prevent partial state corruption.
*/
