// app/api/charts/route.ts
// Provides class student counts and recent attendance trends

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db.ts";

// Helper: parse Date to YYYY-MM-DD string
const formatDate = (date: Date) => date.toISOString().split("T")[0];

/**
 * Consolidates student counts and attendance trends for charting.
 * Attendance trend defaults to zero for missing dates to simplify front-end consumption.
 */
export async function GET() {
  try {
    // Fetch classes with student counts
    const studentsPerClass = await prisma.class.findMany({
      select: {
        id: true,
        name: true,
        _count: { select: { students: true } },
      },
    });

    // Attendance trend: last 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 29);

    const attendances = await prisma.studentAttendance.groupBy({
      by: ["classId", "date"],
      where: {
        date: { gte: thirtyDaysAgo },
        status: "PRESENT",
      },
      _count: { id: true },
    });

    // Build trend per class
    const attendanceTrend = studentsPerClass.map((c) => {
      const trendData = Array.from({ length: 30 }).map((_, i) => {
        const date = formatDate(new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000));
        const countRecord = attendances.find(
          (a) => a.classId === c.id && formatDate(a.date) === date
        );
        return { date, presentCount: countRecord?._count ?? 0 };
      });
      return { className: c.name, data: trendData };
    });

    return NextResponse.json({
      studentsPerClass: studentsPerClass.map((c) => ({
        className: c.name,
        count: c._count.students,
      })),
      attendanceTrend,
    });
  } catch (error) {
    console.error("Charts API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
