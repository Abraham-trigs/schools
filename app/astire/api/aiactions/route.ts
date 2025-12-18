// /app/astire/api/aiactions/route.ts
// Purpose: List and create AI Actions performed in sessions

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db.ts";
import { z } from "zod";

const currentAbrahamId = "hardcoded-abraham-id";

const AIActionSchema = z.object({
  sessionId: z.string(),
  type: z.string().min(1),
  payload: z.any(),
});

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const sessionId = url.searchParams.get("sessionId");
    if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });

    const actions = await prisma.aIAction.findMany({
      where: { sessionId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(actions);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = AIActionSchema.parse(body);

    const action = await prisma.aIAction.create({
      data: {
        ...parsed,
      },
    });

    return NextResponse.json(action);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten().fieldErrors }, { status: 400 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* Design reasoning:
- AIAction logs any automated or user-triggered AI operations.
- GET for auditing, POST for recording actions.
*/

/* Structure:
- GET: collection route filtered by session
- POST: creation route with payload validation
*/

/* Implementation guidance:
- Payload stored as JSON.
*/

/* Scalability insight:
- Could add undo flag, status, and linked user info in future.
*/
