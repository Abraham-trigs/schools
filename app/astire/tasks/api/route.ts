import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const taskSchema = z.object({
  projectId: z.string(),
  title: z.string().min(3),
  description: z.string(),
  priority: z.number().min(1).max(5).optional(),
  milestoneId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId");

  const tasks = await prisma.task.findMany({
    where: projectId ? { projectId } : undefined,
    include: { aiContent: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  try {
    const data = taskSchema.parse(await req.json());

    const task = await prisma.task.create({
      data: {
        ...data,
        ownerId: "some-abraham-id",
      },
    });

    return NextResponse.json(task);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
