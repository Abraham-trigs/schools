// /app/astire/api/chatmessages/route.ts
// Purpose: List and create Chat Messages (USER/AI)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const currentAbrahamId = "hardcoded-abraham-id";

const ChatMessageSchema = z.object({
  sessionId: z.string(),
  sender: z.enum(["USER", "AI"]),
  content: z.string().min(1),
  type: z.enum(["USER", "AI", "QUESTION", "ACTION"]).optional(),
  actionType: z.string().optional(),
  actionPayload: z.any().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const sessionId = url.searchParams.get("sessionId");
    if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });

    const messages = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(messages);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ChatMessageSchema.parse(body);

    const message = await prisma.chatMessage.create({
      data: {
        ...parsed,
        type: parsed.type || (parsed.sender === "AI" ? "AI" : "USER"),
      },
    });

    return NextResponse.json(message);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten().fieldErrors }, { status: 400 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* Design reasoning:
- Supports all chat types: USER, AI, QUESTION, ACTION
- Optional actionType/payload for automation
*/

/* Structure:
- GET: fetch messages for session
- POST: create message with optional action
*/

/* Implementation guidance:
- type inferred if not explicitly provided.
*/

/* Scalability insight:
- Could integrate real-time WebSocket streaming in future.
*/
