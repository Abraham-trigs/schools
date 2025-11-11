import { prisma } from "@/lib/prisma";

export type AIActionType = "SEND_CV" | "ALLOCATE_FUNDS" | "CREATE_TASK" | "ASK_QUESTION";

export interface AIAction {
  type: AIActionType;
  payload: Record<string, any>;
}

export async function aiActionHandler(
  sessionId: string,
  messageContent: string
): Promise<AIAction[]> {
  const actions: AIAction[] = [];

  // Example simple rules (can be replaced with AI logic)
  if (messageContent.toLowerCase().includes("cv")) {
    actions.push({
      type: "SEND_CV",
      payload: {
        target: "hr@example.com",
        content: "User CV submission",
        sessionId,
      },
    });
  }

  if (messageContent.toLowerCase().includes("fund") || messageContent.toLowerCase().includes("finance")) {
    actions.push({
      type: "ALLOCATE_FUNDS",
      payload: {
        target: "user-wallet",
        amount: 1000,
        sessionId,
      },
    });
  }

  if (messageContent.toLowerCase().includes("task")) {
    actions.push({
      type: "CREATE_TASK",
      payload: {
        title: "Follow-up Task",
        description: messageContent,
        sessionId,
      },
    });
  }

  if (messageContent.endsWith("?")) {
    actions.push({
      type: "ASK_QUESTION",
      payload: {
        question: messageContent,
        sessionId,
      },
    });
  }

  // Optionally save actions to DB for record
  for (const action of actions) {
    await prisma.aiAction.create({
      data: {
        sessionId,
        type: action.type,
        payload: JSON.stringify(action.payload),
      },
    });
  }

  return actions;
}
