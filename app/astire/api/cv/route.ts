// /app/astire/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ChatRequestSchema = z.object({
  sessionId: z.string(),
  sender: z.enum(["USER", "AI"]),
  content: z.string().min(1),
});

// AI response generator with real CV fetch
async function generateAIResponse(userMessage: string, sessionId: string) {
  const messages: any[] = [];

  // 1. Simple AI reply
  messages.push({
    type: "AI",
    sender: "AI",
    content: `AI Response to: "${userMessage}"`,
  });

  // 2. Occasionally add a QUESTION
  if (Math.random() > 0.5) {
    messages.push({
      type: "QUESTION",
      sender: "AI",
      content: "What is your current CV or experience summary?",
    });
  }

  // 3. Occasionally add an ACTION (submit CV)
  if (Math.random() > 0.7) {
    // Fetch latest CV for the user/session
    let cvContent = "Default CV content";
    try {
      const cvRes = await fetch(`http://localhost:3000/app/astire/api/cv?sessionId=${sessionId}`);
      if (cvRes.ok) {
        const cvData = await cvRes.json();
        cvContent = cvData.content || cvContent;
      }
    } catch (err) {
      console.error("Error fetching CV:", err);
    }

    messages.push({
      type: "ACTION",
      sender: "AI",
      content: "You can submit your CV to apply for jobs automatically.",
      actionType: "SUBMIT_CV",
      actionPayload: { content: cvContent },
    });
  }

  return messages;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ChatRequestSchema.parse(body);

    // 1. Verify session
    const session = await prisma.chatSession.findUnique({
      where: { id: parsed.sessionId },
      include: { messages: true },
    });
    if (!session)
      return NextResponse.json({ error: "Session not found." }, { status: 404 });

    // 2. Save user message
    const userMessage = await prisma.chatMessage.create({
      data: {
        sessionId: parsed.sessionId,
        sender: parsed.sender,
        content: parsed.content,
        type: "USER",
      },
    });

    // 3. Generate AI messages
    let aiMessages = [];
    if (parsed.sender === "USER") {
      const aiResponses = await generateAIResponse(parsed.content, parsed.sessionId);

      for (const msg of aiResponses) {
        const aiMsg = await prisma.chatMessage.create({
          data: {
            sessionId: parsed.sessionId,
            sender: "AI",
            content: msg.content,
            type: msg.type,
            actionType: msg.actionType,
            actionPayload: msg.actionPayload ? JSON.stringify(msg.actionPayload) : null,
          },
        });
        aiMessages.push(aiMsg);
      }
    }

    const allMessages = await prisma.chatMessage.findMany({
      where: { sessionId: parsed.sessionId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      message: userMessage,
      aiMessages,
      allMessages,
    });
  } catch (error: any) {
    console.error("Chat API POST error:", error);
    return NextResponse.json({ error: error.message || "Server error." }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get("sessionId");
    if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });

    const cv = await prisma.abrahamCV.findFirst({
      where: { userId: "replace-user-id" }, // TODO: fetch real user
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ content: cv?.content || "" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
