// app/api/decisions/[id]/full-chain/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db.ts";
import { SchoolAccount } from "@/lib/schoolAccount.ts";

// -------------------- Recursive helper --------------------
async function getFullDecisionGraph(id: string, tenantId: string, visited = new Set<string>()) {
  if (visited.has(id)) return null; // prevent cycles
  visited.add(id);

  const decision = await prisma.decisionRecord.findUnique({
    where: { id },
    include: { supersedes: true, supersededBy: true },
  });

  if (!decision || decision.tenantId !== tenantId) return null;

  // recursively fetch previous decisions
  const previous = decision.supersedesId
    ? await getFullDecisionGraph(decision.supersedesId, tenantId, visited)
    : null;

  // recursively fetch successors
  const next = [];
  for (const succ of decision.supersededBy) {
    const chain = await getFullDecisionGraph(succ.id, tenantId, visited);
    if (chain) next.push(chain);
  }

  return {
    ...decision,
    supersedes: previous,
    supersededBy: next,
  };
}

// -------------------- GET /api/decisions/:id/full-chain --------------------
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const account = await SchoolAccount.init();
    if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = params;

    const graph = await getFullDecisionGraph(id, account.tenantId);

    if (!graph)
      return NextResponse.json({ error: "Decision not found or access denied" }, { status: 404 });

    return NextResponse.json({ graph });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch decision graph" }, { status: 500 });
  }
}
