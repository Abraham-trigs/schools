// /app/astire/api/milestones/route.ts
// Purpose: List and create Milestones for Abraham

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const currentAbrahamId = "hardcoded-abraham-id";

const MilestoneSchema = z.object({
  projectId: z.string(),
  title: z.string().min(1),
  dueDate: z.string().refine((d) => !isNaN(Date.parse(d)), "Invalid date"),
  completed: z.boolean().optional(),
  paymentAmount: z.number().min(0),
});

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const page = Number(url.searchParams.get("page") || 1);
    const limit = Number(url.searchParams.get("limit") || 20);

    const [milestones, total] = await prisma.$transaction([
      prisma.milestone.findMany({
        where: { ownerId: currentAbrahamId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { dueDate: "asc" },
      }),
      prisma.milestone.count({ where: { ownerId: currentAbrahamId } }),
    ]);

    return NextResponse.json({ milestones, total, page, limit });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = MilestoneSchema.parse(body);

    const milestone = await prisma.milestone.create({
      data: {
        projectId: parsed.projectId,
        title: parsed.title,
        dueDate: new Date(parsed.dueDate),
        completed: parsed.completed ?? false,
        paymentAmount: parsed.paymentAmount,
        ownerId: currentAbrahamId,
      },
    });

    return NextResponse.json(milestone);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten().fieldErrors }, { status: 400 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* Design reasoning:
- Milestones have dueDate ordering, optional completed.
*/

/* Structure:
- GET: paginated list
- POST: validated creation
*/

/* Implementation guidance:
- Normalize dueDate to JS Date.
*/

/* Scalability insight:
- Could extend GET with project filters or status filters.
*/
