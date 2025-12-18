// /app/astire/api/chat/route.ts
// Purpose: Handles chat messages, AI responses via OpenAI, and auto-executable actions for sessions.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db.ts";
import { z } from "zod";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Request validation
const ChatRequestSchema = z.object({
  sessionId: z.string(),
  sender: z.enum(["USER", "AI"]),
  content: z.string().min(1),
});

// Chat message type
interface AIResponse {
  type: "AI" | "QUESTION" | "ACTION";
  sender: "AI";
  content: string;
  actionType?: string;
  actionPayload?: Record<string, any>;
}

// Generate AI responses via OpenAI
async function generateAIResponse(userMessage: string, sessionId: string): Promise<AIResponse[]> {
  const messages: AIResponse[] = [];

  // Fetch context: last 10 messages for context
  const lastMessages = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const prompt = lastMessages
    .reverse()
    .map((m) => `${m.sender}: ${m.content}`)
    .join("\n");
  const finalPrompt = `${prompt}\nUSER: ${userMessage}\nAI:`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: finalPrompt }],
      temperature: 0.7,
      max_tokens: 300,
    });

    const aiText = completion.choices[0]?.message?.content?.trim() || "Sorry, I couldn't respond.";

    // Standard AI message
    messages.push({ type: "AI", sender: "AI", content: aiText });

    // Optional: randomly ask a QUESTION
    if (Math.random() > 0.5) {
      messages.push({ type: "QUESTION", sender: "AI", content: "Can you provide more details on this?" });
    }

    // Optional: ACTION (e.g., SUBMIT_CV)
    if (Math.random() > 0.7) {
      const cv = await prisma.abrahamCV.findFirst({ orderBy: { updatedAt: "desc" } });
      const cvContent = cv?.content || "Default CV content";
      messages.push({
        type: "ACTION",
        sender: "AI",
        content: "You can submit your CV automatically.",
        actionType: "SUBMIT_CV",
        actionPayload: { content: cvContent },
      });
    }
  } catch (err) {
    messages.push({ type: "AI", sender: "AI", content: "AI failed to respond. Please try again." });
  }

  return messages;
}

// POST: Send user message, generate AI responses
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ChatRequestSchema.parse(body);

    // Verify session exists (goal-less sessions allowed)
    const session = await prisma.chatSession.findUnique({
      where: { id: parsed.sessionId },
      include: { messages: true },
    });
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    // Transaction: save user message + AI responses
    const [userMessage, aiMessages] = await prisma.$transaction(async (tx) => {
      const uMsg = await tx.chatMessage.create({
        data: {
          sessionId: parsed.sessionId,
          sender: parsed.sender,
          content: parsed.content,
          type: "USER",
        },
      });

      let aiMsgs: typeof uMsg[] = [];
      if (parsed.sender === "USER") {
        const responses = await generateAIResponse(parsed.content, parsed.sessionId);
        for (const msg of responses) {
          const aiMsg = await tx.chatMessage.create({
            data: {
              sessionId: parsed.sessionId,
              sender: "AI",
              content: msg.content,
              type: msg.type,
              actionType: msg.actionType,
              actionPayload: msg.actionPayload || null,
            },
          });

          if (msg.type === "ACTION" && msg.actionType) {
            await tx.aiAction.create({
              data: { sessionId: parsed.sessionId, type: msg.actionType, payload: msg.actionPayload },
            });
          }

          aiMsgs.push(aiMsg);
        }
      }

      return [uMsg, aiMsgs];
    });

    const allMessages = await prisma.chatMessage.findMany({
      where: { sessionId: parsed.sessionId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ message: userMessage, aiMessages, allMessages });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Server error" }, { status: 400 });
  }
}

// GET: Fetch messages for a session
export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get("sessionId");
    if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });

    const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
    const pageSize = parseInt(req.nextUrl.searchParams.get("pageSize") || "20");

    const messages = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json({ messages, page, pageSize });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}

/*
Design reasoning:
- Integrates OpenAI GPT-4 for real AI responses.
- Preserves transactional integrity: user message + AI messages + actions.
- GET supports pagination.

Structure:
- `generateAIResponse` handles AI/QUESTION/ACTION logic using OpenAI.
- POST validates, persists, and returns all messages.
- GET retrieves messages with pagination.

Implementation guidance:
- AI actions are stored for undo and automation workflows.
- Randomized QUESTION/ACTION messages maintain interactive variety.
- Transactions prevent partial writes.

Scalability insight:
- Multiple concurrent sessions supported.
- ACTIONs can expand to automated workflows.
- OpenAI calls are modular and can support streaming or fine-tuned models.
*/
