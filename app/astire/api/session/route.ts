import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const goalId = searchParams.get("goalId");

    // Fetch sessions: either goal-specific or general (goalId = null)
    let sessions = await prisma.chatSession.findMany({
      where: goalId ? { goalId } : { goalId: null },
      orderBy: { createdAt: "asc" },
      include: { messages: true },
    });

    // Auto-create session if none exist
    if (!sessions.length) {
      const newSession = await prisma.chatSession.create({
        data: {
          goalId: goalId || null,
          ownerId: "replace-owner-id", // TODO: integrate auth
        },
        include: { messages: true },
      });
      sessions = [newSession];
    }

    return NextResponse.json(sessions);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
