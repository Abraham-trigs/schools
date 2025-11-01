import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db.ts";

export async function GET(req: NextRequest) {
  try {
    const students = await prisma.user.count({ where: { role: "STUDENT" } });
    const teachers = await prisma.user.count({ where: { role: "TEACHER" } });
    const classes = await prisma.class.count();
    const parents = await prisma.user.count({ where: { role: "PARENT" } });

    return NextResponse.json({ students, teachers, classes, parents });
  } catch (error) {
    console.error("Summary API error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
