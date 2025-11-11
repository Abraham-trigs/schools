// /app/astire/api/projects/[id]/route.ts
// Purpose: Get, update, delete a single Project

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const currentAbrahamId = "hardcoded-abraham-id";

const ProjectUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  demoUrl: z.string().url().optional(),
  stack: z.string().min(1).optional(),
  status: z.enum(["ACTIVE", "PAUSED", "COMPLETED"]).optional(),
  goalId: z.string().optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const project = await prisma.project.findFirst({
      where: { id: params.id, ownerId: currentAbrahamId },
    });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    return NextResponse.json(project);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const parsed = ProjectUpdateSchema.parse(body);

    const project = await prisma.project.updateMany({
      where: { id: params.id, ownerId: currentAbrahamId },
      data: {
        ...parsed,
        goalId: parsed.goalId || undefined,
      },
    });

    if (project.count === 0)
      return NextResponse.json({ error: "Project not found or not owned" }, { status: 404 });

    return NextResponse.json({ message: "Project updated" });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten().fieldErrors }, { status: 400 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const project = await prisma.project.deleteMany({
      where: { id: params.id, ownerId: currentAbrahamId },
    });
    if (project.count === 0)
      return NextResponse.json({ error: "Project not found or not owned" }, { status: 404 });
    return NextResponse.json({ message: "Project deleted" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* Design reasoning:
- PUT/DELETE ensure only the owner can modify project.
- Optional goalId normalization.
*/

/* Structure:
- GET: fetch single project
- PUT: update validated fields
- DELETE: remove safely
*/

/* Implementation guidance:
- updateMany/deleteMany pattern prevents accidental cross-user edits
*/

/* Scalability insight:
- Can extend GET with include tasks/milestones for detail view
*/
