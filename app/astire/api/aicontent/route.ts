// /app/astire/api/aicontent/route.ts
// Purpose: List and create AIContent linked to tasks

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db.ts";
import { z } from "zod";

const currentAbrahamId = "hardcoded-abraham-id";

const AIContentSchema = z.object({
  taskId: z.string(),
  content: z.string().min(1),
});

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const taskId = url.searchParams.get("taskId");
    if (!taskId) return NextResponse.json({ error: "taskId required" }, { status: 400 });

    const contents = await prisma.aIContent.findMany({
      where: { taskId, ownerId: currentAbrahamId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(contents);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = AIContentSchema.parse(body);

    const content = await prisma.aIContent.create({
      data: {
        ...parsed,
        ownerId: currentAbrahamId,
      },
    });

    return NextResponse.json(content);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten().fieldErrors }, { status: 400 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* Design reasoning:
- AIContent is task-specific.
*/

/* Structure:
- GET: fetch task content
- POST: create new content
*/

/* Implementation guidance:
- Hardcoded Abraham ensures ownership for now.
*/

/* Scalability insight:
- Could support versioning of AIContent per task.
*/
