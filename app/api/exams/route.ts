// app/api/exams/route.ts
// Handles GET (list) and POST (create) for exams

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { cookieUser } from "@/lib/cookieUser.ts";

const ExamCreateSchema = z.object({
  studentId: z.string().cuid(),
  subject: z.string().min(1),
  score: z.preprocess((val) => parseFloat(val as string), z.number()),
  maxScore: z.preprocess((val) => parseFloat(val as string), z.number()),
  date: z.preprocess((val) => new Date(val as string), z.date()).optional(),
});

export async function GET(req: NextRequest) {
  try {
    await cookieUser(req);
    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";
    const page = Number(url.searchParams.get("page") || "1");
    const limit = Number(url.searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const exams = await prisma.exam.findMany({
      where: { subject: { contains: search, mode: "insensitive" } },
      include: { student: true },
      skip,
      take: limit,
      orderBy: { date: "desc" },
    });

    const total = await prisma.exam.count({
      where: { subject: { contains: search, mode: "insensitive" } },
    });

    return NextResponse.json({ data: exams, total });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await cookieUser(req);
    const body = await req.json();
    const parsed = ExamCreateSchema.parse(body);

    const exam = await prisma.exam.create({ data: parsed });
    return NextResponse.json({ data: exam });
  } catch (err: any) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: err.flatten() }, { status: 400 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* 
Design reasoning:
- Simple RESTful collection: GET with search/pagination, POST with validation.
- Includes student relation for full context.
- Normalizes and validates input with Zod.
- Auth-protected using cookieUser.

Structure:
- GET(req): list exams with search and pagination
- POST(req): create new exam with validation

Implementation guidance:
- Wire into Zustand store to fetch/update list and create new exam.
- Frontend uses standard fetch or api client.

Scalability insight:
- Add filters by student, date range, subject easily by extending `where`.
*/
