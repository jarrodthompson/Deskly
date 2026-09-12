"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/config";
import type { AutomationActionType } from "@prisma/client";

async function requireStaffSession() {
  const session = await auth();
  if (!session || session.user.kind !== "staff") throw new Error("Not authenticated");
  return session;
}

export type AutomationConditionInput = { field: string; operator: "equals" | "contains"; value: string };
export type AutomationActionInput = { type: AutomationActionType; value: Record<string, string> };

export async function createAutomation(input: {
  name: string;
  description?: string;
  conditions: AutomationConditionInput[];
  actions: AutomationActionInput[];
}) {
  const session = await requireStaffSession();
  const automation = await prisma.automation.create({
    data: {
      name: input.name,
      description: input.description || null,
      triggerOn: "TICKET_CREATED",
      conditions: input.conditions,
      createdById: session.user.id,
      actions: { create: input.actions.map((a, i) => ({ type: a.type, value: a.value, order: i })) },
    },
  });
  revalidatePath("/automations");
  return automation;
}

export async function toggleAutomationActive(automationId: string, isActive: boolean) {
  await requireStaffSession();
  await prisma.automation.update({ where: { id: automationId }, data: { isActive } });
  revalidatePath("/automations");
}

export async function deleteAutomation(automationId: string) {
  await requireStaffSession();
  await prisma.automation.delete({ where: { id: automationId } });
  revalidatePath("/automations");
}
