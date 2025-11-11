// /app/astire/api/goals/route.ts
// Purpose: List and create Goals for the fixed Abraham user

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const currentAbrahamId = "hardcoded-abraham-id"; // fixed session user

const GoalSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  status: z.enum(["ACTIVE", "PAUSED", "COMPLETED"]).optional(),
  dueDate: z.string().optional(),
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

    const [goals, total] = await prisma.$transaction([
      prisma.goal.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.goal.count({ where }),
    ]);

    return NextResponse.json({ goals, total, page, limit });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = GoalSchema.parse(body);

    const goal = await prisma.goal.create({
      data: {
        ...parsed,
        dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null,
        ownerId: currentAbrahamId,
      },
    });

    return NextResponse.json(goal);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten().fieldErrors }, { status: 400 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* Design reasoning:
- Separate GET/POST routes for collection operations.
- Pagination & search for list scalability.
- Zod validation ensures all inputs normalized & safe.
*/

/* Structure:
- GET: filters by owner & optional search, paginated.
- POST: validates input, sets fixed ownerId.
*/

/* Implementation guidance:
- Replace hardcoded AbrahamId when auth is implemented.
- Use consistent error shape for client parsing.
*/

/* Scalability insight:
- Supports pagination & filtering, easy to extend with tags or goal status filters.
*/
