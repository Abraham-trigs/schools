// /app/astire/api/abrahamcv/route.ts
// Purpose: List and create Abraham CVs

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const currentAbrahamId = "hardcoded-abraham-id";

const CVSchema = z.object({
  goalId: z.string().optional(),
  content: z.string().min(1),
});

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const goalId = url.searchParams.get("goalId") || undefined;

    const cvs = await prisma.abrahamCV.findMany({
      where: {
        userId: currentAbrahamId,
        ...(goalId ? { goalId } : {}),
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(cvs);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CVSchema.parse(body);

    const cv = await prisma.abrahamCV.upsert({
      where: { id: crypto.randomUUID() }, // simple unique, could be goal+user
      create: {
        userId: currentAbrahamId,
        goalId: parsed.goalId || null,
        content: parsed.content,
      },
      update: {
        content: parsed.content,
        goalId: parsed.goalId || null,
      },
    });

    return NextResponse.json(cv);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten().fieldErrors }, { status: 400 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* Design reasoning:
- Single-user CV store, optional goal scoping
- Upsert ensures one CV per user/goal
*/

/* Structure:
- GET: fetch CV(s)
- POST: create or update
*/

/* Implementation guidance:
- Could normalize content (trim, strip HTML) before saving
*/

/* Scalability insight:
- Supports multiple goals, version history could be added
*/
