// app/api/skuunAi/route.ts
// Purpose: Centralized SkuunAi API endpoint managing sessions, messages, AI actions, and automatic recommendations.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db.ts";
import { SchoolAccount } from "@/lib/schoolAccount.ts";
import { z } from "zod";
import type { AIActionType } from "@/lib/types/skuunAiTypes.ts";
import { determineAutoActions, triggerAutoActions } from "@/lib/skuunAiAutoActions.ts";

// -------------------- Zod Schemas --------------------
// Schema for sending a message
const sendMessageSchema = z.object({
  content: z.string().min(1, "Message content cannot be empty"),
  type: z.enum(["TEXT", "JSON", "IMAGE"]),
});

// Schema for triggering an AI action
const triggerActionSchema = z.object({
  type: z.nativeEnum(AIActionType),
  payload: z.any(),
});

// Schema for query parameters (pagination)
const querySchema = z.object({
  page: z.string().optional(),
  perPage: z.string().optional(),
});

// -------------------- Helper: Generate Recommendations --------------------
/**
 * Generates AI recommendations for a given session and action type.
 * Inserts recommendations into the database and skips duplicates.
 */
async function generateRecommendations(
  sessionId: string,
  actionType: AIActionType,
  payload: any
) {
  const recommendations: {
    category: string;
    message: string;
    data?: any;
    targetId?: string;
  }[] = [];

  // Normalize payload to ensure it's an object
  const normalizedPayload = typeof payload === "object" ? payload : { message: payload };

  // Map specific AI actions to recommendation messages
  switch (actionType) {
    case AIActionType.PREDICT_ATTENDANCE:
      recommendations.push({
        category: "Attendance",
        message: "Student may be at risk of chronic absenteeism. Suggest parental notification.",
        data: normalizedPayload,
        targetId: normalizedPayload.studentId,
      });
      break;
    case AIActionType.FLAG_SPECIAL_NEEDS:
      recommendations.push({
        category: "Student Support",
        message: "Student flagged with special needs. Assign counselor and adjust learning plan.",
        data: normalizedPayload,
        targetId: normalizedPayload.studentId,
      });
      break;
    case AIActionType.FINANCIAL_INSIGHTS:
      recommendations.push({
        category: "Finance",
        message: "Outstanding payments detected. Send reminder notifications to parents.",
        data: normalizedPayload,
        targetId: normalizedPayload.studentId,
      });
      break;
    case AIActionType.CHAT_QA:
      recommendations.push({
        category: "AI Chat",
        message: "AI responded to user query with suggested guidance.",
        data: normalizedPayload,
      });
      break;
    default:
      recommendations.push({
        category: "General",
        message: `Action ${actionType} executed. Review insights in dashboard.`,
        data: normalizedPayload,
      });
  }

  if (!recommendations.length) return;

  // Persist recommendations to DB, skipping duplicates
  await prisma.skuunAiRecommendation.createMany({
    data: recommendations.map((rec) => ({
      sessionId,
      category: rec.category,
      message: rec.message,
      data: rec.data,
      targetId: rec.targetId || null,
    })),
    skipDuplicates: true,
  });
}

// -------------------- GET SkuunAi Sessions --------------------
export async function GET(req: NextRequest) {
  try {
    // Auth: Initialize school account context
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const query = querySchema.parse(Object.fromEntries(searchParams.entries()));

    const page = Number(query.page || 1);
    const perPage = Number(query.perPage || 10);

    const total = await prisma.skuunAiSession.count({
      where: { userId: schoolAccount.userId },
    });

    const sessions = await prisma.skuunAiSession.findMany({
      where: { userId: schoolAccount.userId },
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { createdAt: "desc" },
      include: { messages: true, actions: true, SkuunAiRecommendation: true },
    });

    return NextResponse.json({ sessions, total, page, perPage });
  } catch (err: any) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: err.errors }, { status: 400 });
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

// -------------------- POST Message or AI Action --------------------
export async function POST(req: NextRequest) {
  try {
    // Auth: Initialize school account context
    const schoolAccount = await SchoolAccount.init();
    if (!schoolAccount) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    let sessionId: string;

    // -------------------- Case: User message --------------------
    if ("content" in body) {
      const data = sendMessageSchema.parse(body);

      // Create session with the incoming message
      const session = await prisma.skuunAiSession.create({
        data: {
          userId: schoolAccount.userId,
          role: schoolAccount.role,
          messages: { create: { content: data.content, type: data.type, sender: "USER" } },
        },
        include: { messages: true, actions: true, SkuunAiRecommendation: true },
      });

      sessionId = session.id;

      // Determine auto AI actions based on message content & role
      const autoActions = determineAutoActions(data.content, schoolAccount.role);
      if (autoActions.length) await triggerAutoActions(sessionId, autoActions, { message: data.content });

      // Generate AI recommendations concurrently for all auto actions
      await Promise.all(
        autoActions.map((actionType) =>
          generateRecommendations(sessionId, actionType, { message: data.content })
        )
      );
    }
    // -------------------- Case: Direct AI action --------------------
    else if ("type" in body) {
      const data = triggerActionSchema.parse(body);

      const session = await prisma.skuunAiSession.create({
        data: {
          userId: schoolAccount.userId,
          role: schoolAccount.role,
          actions: { create: { type: data.type, payload: data.payload } },
        },
        include: { messages: true, actions: true, SkuunAiRecommendation: true },
      });

      sessionId = session.id;

      await generateRecommendations(sessionId, data.type, data.payload);
    } else {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    // Fetch and return the updated session with related data
    const updatedSession = await prisma.skuunAiSession.findUniqueOrThrow({
      where: { id: sessionId },
      include: { messages: true, actions: true, SkuunAiRecommendation: true },
    });

    return NextResponse.json(updatedSession, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: err.errors }, { status: 400 });
    return NextResponse.json({ error: err.message || "Failed to process request" }, { status: 500 });
  }
}

/*
Design reasoning:
- Centralizes AI session handling, messaging, and automated recommendation creation.
- Ensures every AI action or user message generates actionable insights.
- Authenticated by SchoolAccount to scope data per user and role.

Structure:
- GET: list sessions with messages, actions, and recommendations; supports pagination.
- POST: handles new messages or AI actions, triggers automated AI actions, and stores recommendations.

Implementation guidance:
- Validate all inputs using Zod schemas to prevent invalid payloads.
- Normalize payloads before generating recommendations.
- Concurrently generate recommendations to minimize latency.
- Include auth checks before any DB operation.

Scalability insight:
- Auto-actions and recommendation generation are asynchronous; can scale horizontally.
- Pagination prevents large queries from impacting performance.
- Adding new AIActionTypes requires minimal code changes, just extend the switch in generateRecommendations.
*/
