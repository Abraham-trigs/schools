import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db.ts";

export async function GET(req: NextRequest) {
  try {
    const studentsPerClass = await prisma.class.findMany({
      select: {
        name: true,
        _count: { select: { students: true } },
      },
    });

    const attendanceTrend = []; // placeholder for real attendance logic

    return NextResponse.json({
      studentsPerClass: studentsPerClass.map(c => ({ className: c.name, count: c._count.students })),
      attendanceTrend,
    });
  } catch (error) {
    console.error("Charts API error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
