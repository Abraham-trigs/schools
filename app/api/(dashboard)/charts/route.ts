// app/api/(dashboard)/charts/route.ts
// Purpose: Provides class student counts and recent attendance trends (school-scoped)

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db.ts";
import { SchoolAccount } from "@/lib/schoolAccount.ts";

// Helper: format Date to YYYY-MM-DD
const formatDate = (date: Date) => date.toISOString().split("T")[0];

// -------------------- GET Dashboard Charts --------------------
export async function GET() {
  try {
    // Auth & school scoping
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Fetch classes for this school with student counts
    const studentsPerClass = await prisma.class.findMany({
      where: { schoolId: schoolAccount.schoolId },
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
        class: { schoolId: schoolAccount.schoolId },
        date: { gte: thirtyDaysAgo },
        status: "PRESENT",
      },
      _count: { id: true },
    });

    // Map attendances for O(1) lookup
    const attendanceMap: Record<string, Record<string, number>> = {};
    attendances.forEach((a) => {
      const classId = a.classId;
      const dateStr = formatDate(a.date);
      if (!attendanceMap[classId]) attendanceMap[classId] = {};
      attendanceMap[classId][dateStr] = a._count.id;
    });

    // Build trend per class with zero-filling
    const attendanceTrend = studentsPerClass.map((c) => {
      const trendData = Array.from({ length: 30 }).map((_, i) => {
        const date = formatDate(new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000));
        return { date, presentCount: attendanceMap[c.id]?.[date] ?? 0 };
      });
      return { className: c.name, data: trendData };
    });

    return NextResponse.json({
      studentsPerClass: studentsPerClass.map((c) => ({ className: c.name, count: c._count.students })),
      attendanceTrend,
    });
  } catch (err: any) {
    console.error("Charts API error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}

/*
Design reasoning:
- SchoolAccount ensures multi-tenant isolation
- Attendance trend zero-filling simplifies frontend rendering
- Typed and scoped to prevent cross-school data leaks

Structure:
- GET(): main handler
- Maps class counts and attendance trends in a single response
- Attendance grouped via Prisma.groupBy for efficiency

Implementation guidance:
- Drop into /app/api/(dashboard)/charts
- Frontend can use studentsPerClass for summary cards and attendanceTrend for chart plotting
- Handles 401 and 500 errors consistently

Scalability insight:
- Can add optional query params (classId, date range) with Zod validation
- Efficient for large schools via groupBy
- Future enhancements: caching or pre-aggregated attendance tables
*/
