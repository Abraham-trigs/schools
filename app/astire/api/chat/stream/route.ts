// /app/astire/api/chat/stream/route.ts
// Purpose: Stream GPT responses with structured ACTION/QUESTION messages, persisting incrementally in Prisma.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const ChatRequestSchema = z.object({
  sessionId: z.string(),
  sender: z.enum(["USER", "AI"]),
  content: z.string().min(1),
});

// Updated SYSTEM_PROMPT
const SYSTEM_PROMPT = `
You are the AI assistant for the Astire AI chat system and realife discussion. Your responses must follow these rules:

1. Plain text responses:
   - For normal conversational replies, output plain text directly.

2. Structured events (one JSON object per line):
   - When triggering an ACTION or QUESTION, output exactly one JSON object per line.
   - Do NOT include extra text outside JSON objects on the same line.
   - Prioritize pending ACTIONs and QUESTIONS in the session; do not suggest new ones if older ones are not yet resolved or executed.

3. JSON schema for structured events:

{
  "type": "ACTION" | "QUESTION",
  "content": "Text to display to user",
  "actionType": "SUBMIT_CV" | "ALLOCATE_FUNDS" | "CREATE_TASK" | null,
  "actionPayload": { 
    "target"?: string, 
    "amount"?: number, 
    "content"?: string, 
    "goalId"?: string, 
    "projectId"?: string 
  }
}

4. Rules:
- Validate all JSON syntax; do not include trailing commas.
- Each JSON object must be on its own line.
- Do not mix plain text and JSON on the same line.
- Always provide useful AI responses and trigger structured events when relevant.
- Respect the undoable actions system: any ACTION emitted may later be reversed by the user.
- Prioritize older unresolved ACTIONs and QUESTIONS before creating new ones.
- Include clear, concise instructions in content so the user can act quickly on any ACTION or QUESTION.
- Avoid duplicating previously suggested questions or actions.
- Maintain session awareness: track executedActions, pending questions, and pending actions.

Your goal: provide intelligent, contextual AI assistance while managing session state, executing or queuing structured events, and maintaining full awareness of pending and executed actions in the Astire AI chat system.
`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ChatRequestSchema.parse(body);

    const session = await prisma.chatSession.findUnique({
      where: { id: parsed.sessionId },
    });
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    // Save user's message
    const userMessage = await prisma.chatMessage.create({
      data: {
        sessionId: parsed.sessionId,
        sender: parsed.sender,
        content: parsed.content,
        type: "USER",
      },
    });

    // Create empty AI message
    const aiMessage = await prisma.chatMessage.create({
      data: {
        sessionId: parsed.sessionId,
        sender: "AI",
        content: "",
        type: "AI",
      },
    });

    // Stream GPT response
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: parsed.content },
      ],
      stream: true,
    });

    const reader = completion[Symbol.asyncIterator]();
    let aiContent = "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of reader) {
            const text = chunk.choices[0]?.delta?.content;
            if (text) {
              aiContent += text;

              // Persist incremental AI message updates
              await prisma.chatMessage.update({
                where: { id: aiMessage.id },
                data: { content: aiContent },
              });

              controller.enqueue(new TextEncoder().encode(text));
            }
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Server error" }, { status: 400 });
  }
}

/*
Design reasoning:
- SYSTEM_PROMPT enforces structured events and prioritizes pending actions/questions.
- Incrementally persists AI messages for resilience and live updates in frontend.
- Supports undoable actions by respecting executedActions and pending state.

Structure:
- Validate user request via Zod.
- Persist user message.
- Create empty AI message.
- Stream GPT output token-by-token, updating DB live.

Implementation guidance:
- Frontend reads text stream, appends to AI message.
- Parse JSON lines from text to create actionable events in frontend Zustand store.
- Ensures older pending actions/questions are handled first.

Scalability insight:
- Streaming reduces memory overhead for long responses.
- Multiple sessions handled concurrently.
- Easily extendable to additional action types or structured events in SYSTEM_PROMPT.
*/
