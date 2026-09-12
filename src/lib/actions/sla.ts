"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/config";
import { DEFAULT_SLA_RULES } from "@/lib/sla";
import type { TicketPriority } from "@prisma/client";

async function requireStaffSession() {
  const session = await auth();
  if (!session || session.user.kind !== "staff") throw new Error("Not authenticated");
  return session;
}

export async function createSlaPolicy(name: string, description?: string) {
  await requireStaffSession();
  const policy = await prisma.sLAPolicy.create({ data: { name, description: description || null } });
  await prisma.sLARule.createMany({ data: DEFAULT_SLA_RULES.map((r) => ({ ...r, slaPolicyId: policy.id })) });
  revalidatePath("/sla");
  return policy;
}

export async function updateSlaRule(policyId: string, priority: TicketPriority, firstResponseMinutes: number, resolutionMinutes: number) {
  await requireStaffSession();
  await prisma.sLARule.upsert({
    where: { slaPolicyId_priority: { slaPolicyId: policyId, priority } },
    update: { firstResponseMinutes, resolutionMinutes },
    create: { slaPolicyId: policyId, priority, firstResponseMinutes, resolutionMinutes },
  });
  revalidatePath("/sla");
}

export async function setDefaultSlaPolicy(policyId: string) {
  await requireStaffSession();
  await prisma.$transaction([
    prisma.sLAPolicy.updateMany({ data: { isDefault: false }, where: {} }),
    prisma.sLAPolicy.update({ where: { id: policyId }, data: { isDefault: true } }),
  ]);
  revalidatePath("/sla");
}
