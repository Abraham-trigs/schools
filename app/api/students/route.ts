// app/api/students/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SchoolAccount } from "@/lib/schoolAccount";

export async function GET(req: NextRequest) {
  try {
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const perPage = parseInt(searchParams.get("perPage") || "20", 10);
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * perPage;

    const where: any = { schoolId: schoolAccount.schoolId };
    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: "insensitive" } } },
        { application: { firstName: { contains: search, mode: "insensitive" } } },
        { application: { surname: { contains: search, mode: "insensitive" } } },
        { application: { wardEmail: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [students, total] = await prisma.$transaction([
      prisma.student.findMany({
        where,
        include: {
          user: true,
          class: true,
          application: {
            include: {
              previousSchools: true,
              familyMembers: true,
              admissionPayment: true,
            },
          },
        },
        skip,
        take: perPage,
        orderBy: { createdAt: "desc" },
      }),
      prisma.student.count({ where }),
    ]);

    return NextResponse.json({
      students,
      pagination: {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
