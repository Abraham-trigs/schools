// /app/astire/api/tasks/route.ts
// Purpose: List and create Tasks for Abraham

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const currentAbrahamId = "hardcoded-abraham-id";

const TaskSchema = z.object({
  projectId: z.string(),
  title: z.string().min(1),
  description: z.string().min(1),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  priority: z.number().min(1).max(5).optional(),
  milestoneId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const page = Number(url.searchParams.get("page") || 1);
    const limit = Number(url.searchParams.get("limit") || 20);
    const search = url.searchParams.get("search") || "";

    const where = {
      ownerId: currentAbrahamId,
      title: { contains: search, mode: "insensitive" },
    };

    const [tasks, total] = await prisma.$transaction([
      prisma.task.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.task.count({ where }),
    ]);

    return NextResponse.json({ tasks, total, page, limit });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = TaskSchema.parse(body);

    const task = await prisma.task.create({
      data: {
        ...parsed,
        status: parsed.status || "TODO",
        priority: parsed.priority || 3,
        milestoneId: parsed.milestoneId || null,
        ownerId: currentAbrahamId,
      },
    });

    return NextResponse.json(task);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten().fieldErrors }, { status: 400 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* Design reasoning:
- GET: paginated/searchable task list.
- POST: ensures all required fields validated and owner attached.
*/

/* Structure:
- GET: collection route
- POST: creation route with Zod validation
*/

/* Implementation guidance:
- Status and priority defaults; milestone optional.
*/

/* Scalability insight:
- Can add filters by projectId, milestoneId, status for UX.
*/
