// utils/flattenDecisionChain.ts

import type { DecisionRecord } from "@prisma/client";

// Recursive helper to flatten nested supersedes/supersededBy
export function flattenDecisionChain(
  node: DecisionRecord & { supersedes?: any; supersededBy?: any[] },
  visited = new Set<string>()
): (DecisionRecord & { supersedes?: any; supersededBy?: any[] })[] {
  if (!node || visited.has(node.id)) return [];
  visited.add(node.id);

  const previous = node.supersedes ? flattenDecisionChain(node.supersedes, visited) : [];
  const current = { ...node, supersedes: undefined, supersededBy: undefined };
  const successors: any[] = [];

  if (node.supersededBy?.length) {
    for (const succ of node.supersededBy) {
      successors.push(...flattenDecisionChain(succ, visited));
    }
  }

  return [...previous, current, ...successors];
}




// import { flattenDecisionChain } from "@/utils/flattenDecisionChain";

// // Suppose you fetched the nested full-chain graph
// const { graph } = await fetch("/api/decisions/123/full-chain").then(res => res.json());

// // Flatten it into a simple array for UI
// const linearChain = flattenDecisionChain(graph);

// linearChain.forEach(d => {
//   console.log(d.title, d.status, d.implementedAt);
// });
