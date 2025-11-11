// /app/astire/api/chatsessions/route.ts
// Purpose: List and create Chat Sessions for Abraham

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const currentAbrahamId = "hardcoded-abraham-id";

const ChatSessionSchema = z.object({
  goalId: z.string(),
  name: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const goalId = url.searchParams.get("goalId") || undefined;
    const sessions = await prisma.chatSession.findMany({
      where: {
        ownerId: currentAbrahamId,
        ...(goalId ? { goalId } : {}),
      },
      include: { messages: true },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(sessions);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ChatSessionSchema.parse(body);

    const session = await prisma.chatSession.create({
      data: {
        goalId: parsed.goalId,
        name: parsed.name || `Session ${new Date().toLocaleString()}`,
        ownerId: currentAbrahamId,
      },
      include: { messages: true },
    });

    return NextResponse.json(session);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten().fieldErrors }, { status: 400 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* Design reasoning:
- Sessions are grouped by goals; GET optionally filters by goal.
*/

/* Structure:
- GET: list sessions
- POST: create new session with optional name
*/

/* Implementation guidance:
- Messages included to allow frontend immediate display.
*/

/* Scalability insight:
- Can add session archiving or multi-user support later.
*/
