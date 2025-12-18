// utils/getLatestDecisions.ts

import type { DecisionRecord } from "@prisma/client";

// Flatten nested graph but keep only the latest for each chain
export function getLatestDecisions(
  node: DecisionRecord & { supersedes?: any; supersededBy?: any[] },
  latestMap = new Map<string, DecisionRecord>()
) {
  if (!node) return [];

  // If this decision ID already exists, compare timestamps
  const existing = latestMap.get(node.id);
  if (!existing || (node.implementedAt && existing.implementedAt && node.implementedAt > existing.implementedAt)) {
    latestMap.set(node.id, node);
  }

  if (node.supersededBy?.length) {
    for (const succ of node.supersededBy) {
      getLatestDecisions(succ, latestMap);
    }
  }

  if (node.supersedes) {
    getLatestDecisions(node.supersedes, latestMap);
  }

  return Array.from(latestMap.values()).sort((a, b) =>
    a.createdAt > b.createdAt ? 1 : -1
  );
}



// import { getLatestDecisions } from "@/utils/getLatestDecisions";

// const { graph } = await fetch("/api/decisions/123/full-chain").then(res => res.json());

// const latestDecisions = getLatestDecisions(graph);

// latestDecisions.forEach(d => {
//   console.log(d.title, d.status, d.implementedAt);
// });
