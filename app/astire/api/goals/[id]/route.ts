// /app/astire/api/goals/[id]/route.ts
// Purpose: Get, update, delete a single Goal

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db.ts";
import { z } from "zod";

const currentAbrahamId = "hardcoded-abraham-id";

const GoalUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  status: z.enum(["ACTIVE", "PAUSED", "COMPLETED"]).optional(),
  dueDate: z.string().optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const goal = await prisma.goal.findFirst({
      where: { id: params.id, ownerId: currentAbrahamId },
    });
    if (!goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    return NextResponse.json(goal);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const parsed = GoalUpdateSchema.parse(body);

    const goal = await prisma.goal.updateMany({
      where: { id: params.id, ownerId: currentAbrahamId },
      data: { ...parsed, dueDate: parsed.dueDate ? new Date(parsed.dueDate) : undefined },
    });

    if (goal.count === 0)
      return NextResponse.json({ error: "Goal not found or not owned" }, { status: 404 });

    return NextResponse.json({ message: "Goal updated" });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten().fieldErrors }, { status: 400 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const goal = await prisma.goal.deleteMany({
      where: { id: params.id, ownerId: currentAbrahamId },
    });
    if (goal.count === 0)
      return NextResponse.json({ error: "Goal not found or not owned" }, { status: 404 });
    return NextResponse.json({ message: "Goal deleted" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* Design reasoning:
- PUT/DELETE check ownerId to protect user data integrity.
- Zod ensures optional updates normalized.
*/

/* Structure:
- GET: single resource
- PUT: update with validation
- DELETE: remove safely
*/

/* Implementation guidance:
- Use updateMany/deleteMany with owner filter for security.
*/

/* Scalability insight:
- Can easily extend with sub-resource checks (projects, sessions linked to goal).
*/
