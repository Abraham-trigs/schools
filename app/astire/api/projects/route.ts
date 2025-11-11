// /app/astire/api/projects/route.ts
// Purpose: List and create Projects for Abraham

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const currentAbrahamId = "hardcoded-abraham-id";

const ProjectSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  demoUrl: z.string().url().optional(),
  stack: z.string().min(1),
  status: z.enum(["ACTIVE", "PAUSED", "COMPLETED"]).optional(),
  goalId: z.string().optional(),
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

    const [projects, total] = await prisma.$transaction([
      prisma.project.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.project.count({ where }),
    ]);

    return NextResponse.json({ projects, total, page, limit });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ProjectSchema.parse(body);

    const project = await prisma.project.create({
      data: {
        ...parsed,
        goalId: parsed.goalId || null,
        status: parsed.status || "ACTIVE",
        ownerId: currentAbrahamId,
      },
    });

    return NextResponse.json(project);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten().fieldErrors }, { status: 400 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* Design reasoning:
- GET: paginated, searchable project list.
- POST: validates input, attaches owner.
*/

/* Structure:
- GET: collection route
- POST: creation route with Zod validation
*/

/* Implementation guidance:
- ownerId hardcoded; replace with auth session later.
*/

/* Scalability insight:
- Easily extendable with project tags or additional filters.
*/
